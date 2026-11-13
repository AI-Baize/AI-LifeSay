package org.aibaize.lifesay;

import android.app.*;
import android.content.*;
import android.content.res.AssetFileDescriptor;
import android.media.*;
import android.media.session.MediaSession;
import android.os.*;
import org.json.*;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.util.*;

public class ListeningService extends Service {
    private static final String BASE = "public/course-package/formal-v1.1/";
    private static final String CHANNEL = "listening_playback";
    private static final int NOTICE = 966;
    private static volatile JSONObject snapshot = new JSONObject();
    private static volatile boolean active;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final List<Track> queue = new ArrayList<>();
    private final AudioAttributes audio = new AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build();
    private MediaPlayer player;
    private MediaSession session;
    private AudioManager manager;
    private AudioFocusRequest focusRequest;
    private final AudioManager.OnAudioFocusChangeListener focusListener = change -> {
        if (change < 0) handler.post(this::pause);
    };
    private PowerManager.WakeLock wake;
    private int cursor;
    private int roundsRemaining = 1;
    private long scheduledAt;
    private boolean  paused, prepared;
    private long gapUntil, remainingGap;
    private String kind, identity;
    private final Runnable nextTrack = this::advance;

    private static final class Track {
        final String asset, title;
        final int scene, line, gap;
        final float speed;
        Track(String asset,String title,int scene,int line,int gap,float speed) {
            this.asset=asset; this.title=title; this.scene=scene; this.line=line; this.gap=gap; this.speed=speed;
        }
    }

    static Intent playIntent(Context c, JSONArray scenes, String kind, int scene, int line) {
        return new Intent(c,ListeningService.class).setAction("play")
            .putExtra("scenes",scenes==null ? "[]" : scenes.toString()).putExtra("kind",kind)
            .putExtra("scene",scene).putExtra("line",line);
    }
    static JSONObject state() { return snapshot; }
    static boolean busy() { return active; }

    static JSONArray readIndex(Context c) throws Exception {
        try (InputStream input = c.getAssets().open(BASE+"learning-index.json");
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            for (int count; (count=input.read(buffer))!=-1;) output.write(buffer,0,count);
            return new JSONObject(output.toString("UTF-8")).getJSONArray("listening_programs");
        }
    }

    private void load(JSONArray scenes, String kind) throws Exception {
        JSONArray programs = readIndex(this);
        Map<String,JSONObject> available = new HashMap<>();
        for (int i=0;i<programs.length();i++) {
            JSONObject p = programs.getJSONObject(i);
            if (kind.equals(p.optString("kind"))) available.put(p.getString("scene_id"),p);
        }
        if (scenes.length()==0 || scenes.length()>available.size()) throw new IllegalArgumentException();
        for (int scene=0;scene<scenes.length();scene++) {
            JSONObject program = available.get(scenes.getString(scene));
            if (program == null) throw new IllegalArgumentException();
            boolean bedtime = "SC-C01-009".equals(program.optString("scene_id"));
            float rate = "melodic_rhyme".equals(program.optString("audio_mode")) ? 1f : bedtime ? .8f : .9f;
            JSONArray lines = program.getJSONArray("lines");
            for (int line=0;line<lines.length();line++) {
                JSONObject item = lines.getJSONObject(line);
                String asset = item.getString("audio_asset");
                if (!asset.startsWith("audio/") || asset.contains("..")) throw new IllegalArgumentException();
                int gap = line==lines.length()-1 ? 3000 : bedtime ? 1400 : 1100;
                queue.add(new Track(asset,program.optString("title","AI LifeSay"),scene,line,gap,rate));
            }
        }
    }

    @Override public IBinder onBind(Intent intent) { return null; }

    @Override public void onCreate() {
        super.onCreate();
        manager = getSystemService(AudioManager.class);
        wake = getSystemService(PowerManager.class).newWakeLock(PowerManager.PARTIAL_WAKE_LOCK,"AI-LifeSay:Listening");
        session = new MediaSession(this,"Listening");
        session.setCallback(new MediaSession.Callback() {
            @Override public void onPause() { pause(); }
            @Override public void onPlay() { resume(); }
            @Override public void onStop() { end("idle"); }
        },handler);
        if (Build.VERSION.SDK_INT>=26) {
            NotificationChannel channel = new NotificationChannel(CHANNEL,"听一听",NotificationManager.IMPORTANCE_LOW);
            getSystemService(NotificationManager.class).createNotificationChannel(channel);
        }
    }

    @Override public int onStartCommand(Intent intent,int flags,int startId) {
        if (intent==null || intent.getAction()==null) { stopSelf(); return START_NOT_STICKY; }
        switch (intent.getAction()) {
            case "pause": pause(); break;
            case "resume": resume(); break;
            case "stop": end("idle"); break;
            case "play":
                reset();
                scheduledAt=intent.getLongExtra("scheduledAt",0);
                roundsRemaining=Math.max(1,Math.min(10,intent.getIntExtra("playCount",1)));
                kind=intent.getStringExtra("kind");
                identity=intent.getStringExtra("scenes");

                paused=false;
                active=true;
                session.setActive(true);
                try {
                    startForeground(NOTICE,notification("正在准备音频"));
                    load(new JSONArray(identity),kind);
                    int scene=intent.getIntExtra("scene",0), line=intent.getIntExtra("line",0);
                    for (int i=0;i<queue.size();i++) {
                        Track t=queue.get(i);
                        if (t.scene==scene && t.line==line) { cursor=i; break; }
                    }
                    if (queue.isEmpty() || !takeFocus()) { end("error"); break; }
                    keepAwake();
                    startTrack();
                } catch (Exception error) { android.util.Log.e("LifeSayAlarm","Unable to prepare listening",error); end("error"); }
                break;
            default: end("idle");
        }
        return START_NOT_STICKY;
    }

    private boolean takeFocus() {
        if (Build.VERSION.SDK_INT>=26) {
            if (focusRequest==null) focusRequest=new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(audio).setOnAudioFocusChangeListener(focusListener,handler)
                .setWillPauseWhenDucked(true).build();
            return manager.requestAudioFocus(focusRequest)==AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
        }
        return manager.requestAudioFocus(focusListener,AudioManager.STREAM_MUSIC,AudioManager.AUDIOFOCUS_GAIN)
            ==AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
    }

    private void keepAwake() { if (!wake.isHeld()) wake.acquire(3*60*60*1000L); }
    private void releaseWake() { if (wake.isHeld()) wake.release(); }

    private void startTrack() {
        Track track=queue.get(cursor);
        MediaPlayer next=new MediaPlayer();
        player=next;
        prepared=false;
        try (AssetFileDescriptor fd=getAssets().openFd(BASE+track.asset)) {
            next.setAudioAttributes(audio);
            next.setDataSource(fd.getFileDescriptor(),fd.getStartOffset(),fd.getLength());
            next.setOnPreparedListener(p -> {
                if (p!=player) return;
                prepared=true;
                if (!paused) playPrepared();
            });
            next.setOnErrorListener((p,a,b)-> { if (p==player) end("error"); return true; });
            next.setOnCompletionListener(p -> {
                if (p!=player) return;
                releasePlayer();
                if (cursor==queue.size()-1) {
                    if (--roundsRemaining<=0) { end("complete"); return; }
                    cursor=-1;
                }
                remainingGap=track.gap;
                if (!paused) scheduleGap();
            });
            next.prepareAsync();
            update(paused ? "paused" : "playing");
        } catch (Exception error) { end("error"); }
    }

    private void playPrepared() {
        try {
            player.setPlaybackParams(player.getPlaybackParams().setSpeed(queue.get(cursor).speed));
            player.start();
            if (scheduledAt>0) {
                ListeningAlarms.playbackResult(this,scheduledAt,"played");
                scheduledAt=0;
            }
        } catch (RuntimeException error) { end("error"); }
    }

    private void scheduleGap() {
        gapUntil=SystemClock.elapsedRealtime()+remainingGap;
        handler.postDelayed(nextTrack,remainingGap);
    }

    private void advance() {
        gapUntil=remainingGap=0;
        if (!active || paused) return;
        cursor++;
        startTrack();
    }

    private void pause() {
        if (!active || paused) return;
        paused=true;
        if (prepared && player!=null) player.pause();
        if (gapUntil!=0) remainingGap=Math.max(0,gapUntil-SystemClock.elapsedRealtime());
        gapUntil=0;
        handler.removeCallbacks(nextTrack);
        releaseWake();
        update("paused");
    }

    private void resume() {
        if (!active || !paused || !takeFocus()) return;
        paused=false;
        keepAwake();
        if (prepared && player!=null) playPrepared();
        else if (player==null) scheduleGap();
        if (active) update("playing");
    }

    private Notification notification(String title) {
        PendingIntent open=PendingIntent.getActivity(this,0,new Intent(this,MainActivity.class),
            PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);
        String action=paused ? "resume" : "pause";
        PendingIntent control=PendingIntent.getService(this,1,new Intent(this,ListeningService.class).setAction(action),
            PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);
        Notification.Builder builder=Build.VERSION.SDK_INT>=26 ? new Notification.Builder(this,CHANNEL) : new Notification.Builder(this);
        return builder.setSmallIcon(android.R.drawable.ic_media_play).setContentTitle(title)
            .setContentIntent(open).setOnlyAlertOnce(true).setOngoing(!paused)
            .addAction(paused ? android.R.drawable.ic_media_play : android.R.drawable.ic_media_pause,
                paused ? "继续" : "暂停",control)
            .setStyle(new Notification.MediaStyle().setMediaSession(session.getSessionToken()).setShowActionsInCompactView(0))
            .build();
    }

    private void update(String status) {
        Track t=queue.isEmpty() ? null : queue.get(cursor);
        JSONObject state=new JSONObject();
        try {
            state.put("status",status).put("kind",kind).put("identity",identity)
                .put("scene",t==null?0:t.scene).put("line",t==null?0:t.line);
        } catch (JSONException ignored) {}
        snapshot=state;
        if (active && t!=null) {
            int value=paused ? android.media.session.PlaybackState.STATE_PAUSED : android.media.session.PlaybackState.STATE_PLAYING;
            session.setPlaybackState(new android.media.session.PlaybackState.Builder().setState(value,0,paused?0:1)
                .setActions(android.media.session.PlaybackState.ACTION_PLAY_PAUSE|android.media.session.PlaybackState.ACTION_PLAY|
                    android.media.session.PlaybackState.ACTION_PAUSE|android.media.session.PlaybackState.ACTION_STOP).build());
            getSystemService(NotificationManager.class).notify(NOTICE,notification(t.title));
        }
    }

    private void releasePlayer() {
        MediaPlayer old=player;
        player=null;
        if (old!=null) {
            if (prepared) {
                try { old.stop(); } catch (IllegalStateException ignored) {}
            }
            old.release();
        }
        prepared=false;
    }

    private void reset() {
        handler.removeCallbacks(nextTrack);
        releasePlayer();
        releaseWake();
        queue.clear();
        cursor=0;
        roundsRemaining=1;
        remainingGap=gapUntil=0;
    }

    private void end(String status) {
        if (scheduledAt>0) {
            ListeningAlarms.playbackResult(this,scheduledAt,"failed");
            scheduledAt=0;
        }
        active=false;
        update(status);
        reset();
        if (Build.VERSION.SDK_INT>=26 && focusRequest!=null) manager.abandonAudioFocusRequest(focusRequest);
        else manager.abandonAudioFocus(focusListener);
        session.setActive(false);
        stopForeground(STOP_FOREGROUND_REMOVE);
        stopSelf();
    }

    @Override public void onDestroy() {
        if (active) update("idle");
        active=false;
        reset();
        if (Build.VERSION.SDK_INT>=26 && focusRequest!=null) manager.abandonAudioFocusRequest(focusRequest);
        else manager.abandonAudioFocus(focusListener);
        session.release();
        super.onDestroy();
    }
}
