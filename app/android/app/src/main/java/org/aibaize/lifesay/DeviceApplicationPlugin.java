package org.aibaize.lifesay;

import android.content.Intent;
import android.app.Activity;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.annotation.ActivityCallback;
import java.io.FileInputStream;
import java.io.OutputStream;
import android.net.Uri;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import androidx.core.content.FileProvider;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.UUID;

@CapacitorPlugin(name="DeviceApplication")
public class DeviceApplicationPlugin extends Plugin {
    private static final String ALIAS="aienglish-level-device-v2";
    @PluginMethod public void identity(PluginCall call) {
        try { KeyStore s=KeyStore.getInstance("AndroidKeyStore"); s.load(null);
            if(!s.containsAlias(ALIAS)){call.reject("请先生成设备申请");return;}
            JSObject r=new JSObject();r.put("spki",Base64.encodeToString(s.getCertificate(ALIAS).getPublicKey().getEncoded(),Base64.NO_WRAP));call.resolve(r);
        }catch(Exception e){call.reject("无法读取设备身份",e);}
    }
    @PluginMethod public void unwrap(PluginCall call) {
        try {KeyStore s=KeyStore.getInstance("AndroidKeyStore");s.load(null);
            javax.crypto.Cipher c=javax.crypto.Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
            c.init(javax.crypto.Cipher.DECRYPT_MODE,s.getKey(ALIAS,null),new javax.crypto.spec.OAEPParameterSpec("SHA-256","MGF1",java.security.spec.MGF1ParameterSpec.SHA256,new javax.crypto.spec.PSource.PSpecified(Base64.decode(call.getString("label"),Base64.DEFAULT))));
            byte[] key=c.doFinal(Base64.decode(call.getString("wrapped"),Base64.DEFAULT));
            if(key.length!=32)throw new Exception("Invalid key length");
            JSObject r=new JSObject();r.put("key",Base64.encodeToString(key,Base64.NO_WRAP));java.util.Arrays.fill(key,(byte)0);call.resolve(r);
        }catch(Exception e){call.reject("许可与设备不匹配或设备不支持此加密参数",e);}
    }
    @PluginMethod public void shareRequest(PluginCall call) {
        try {
            KeyStore store=KeyStore.getInstance("AndroidKeyStore"); store.load(null);
            if (!store.containsAlias(ALIAS)) {
                KeyPairGenerator gen=KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_RSA,"AndroidKeyStore");
                gen.initialize(new KeyGenParameterSpec.Builder(ALIAS,KeyProperties.PURPOSE_DECRYPT)
                    .setKeySize(2048).setDigests(KeyProperties.DIGEST_SHA256,KeyProperties.DIGEST_SHA1)
                    .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_RSA_OAEP).build());
                gen.generateKeyPair();
            }
            String requestId=UUID.randomUUID().toString();
            String appVersion=getContext().getPackageManager().getPackageInfo(getContext().getPackageName(),0).versionName;
            JSObject request=new JSObject(); request.put("schema_version",2); request.put("product_id","aienglish");
            request.put("app_id","aienglish-test"); request.put("app_version",appVersion);
            request.put("request_id",requestId);
            request.put("public_key_spki",Base64.encodeToString(store.getCertificate(ALIAS).getPublicKey().getEncoded(),Base64.NO_WRAP));
            File directory=new File(getContext().getCacheDir(),"device-applications");
            if(!directory.exists()&&!directory.mkdirs()) throw new Exception("Cannot prepare request");
            File[] old=directory.listFiles(); if(old!=null) for(File f:old) if(f.isFile()&&f.lastModified()<System.currentTimeMillis()-86400000L) f.delete();
            File output=new File(directory,"device-request-"+requestId+".json");
            try(FileOutputStream stream=new FileOutputStream(output)){stream.write(request.toString().getBytes(StandardCharsets.UTF_8));}
            Uri uri=FileProvider.getUriForFile(getContext(),getContext().getPackageName()+".fileprovider",output);
            getActivity().runOnUiThread(()->{
                try {
                    Intent intent=new Intent(Intent.ACTION_SEND); intent.setType("application/json");
                    intent.putExtra(Intent.EXTRA_STREAM,uri); intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    getActivity().startActivity(Intent.createChooser(intent,"私密发送设备申请"));
                    JSObject result=new JSObject(); result.put("status","share_sheet_opened"); call.resolve(result);
                }catch(Exception error){call.reject("无法打开系统分享，请稍后重试",error);}
            });
        } catch(Exception error){call.reject("无法创建设备申请",error);}
    }

    // V3 has a separate device identity; never reuse or delete the experimental V2 alias.
    private static final String FORMAL_ALIAS="lifesay-device-v3";
    @PluginMethod public void formalIdentity(PluginCall call) {
        try { KeyStore s=KeyStore.getInstance("AndroidKeyStore");s.load(null);
            if(!s.containsAlias(FORMAL_ALIAS)){call.reject("请先生成正式设备申请");return;}
            JSObject r=new JSObject();r.put("spki",Base64.encodeToString(s.getCertificate(FORMAL_ALIAS).getPublicKey().getEncoded(),Base64.NO_WRAP));r.put("environment",(getContext().getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE)!=0?"test":"production");call.resolve(r);
        } catch(Exception e){call.reject("无法读取设备身份",e);}
    }
    @PluginMethod public void unwrapFormal(PluginCall call) {
        try { KeyStore s=KeyStore.getInstance("AndroidKeyStore");s.load(null);
            if(!s.containsAlias(FORMAL_ALIAS))throw new Exception("missing key");
            javax.crypto.Cipher c=javax.crypto.Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
            c.init(javax.crypto.Cipher.DECRYPT_MODE,s.getKey(FORMAL_ALIAS,null),new javax.crypto.spec.OAEPParameterSpec("SHA-256","MGF1",java.security.spec.MGF1ParameterSpec.SHA1,javax.crypto.spec.PSource.PSpecified.DEFAULT));
            byte[] key=c.doFinal(Base64.decode(call.getString("wrapped"),Base64.DEFAULT));
            if(key.length!=32)throw new Exception("Invalid key length");
            JSObject r=new JSObject();r.put("key",Base64.encodeToString(key,Base64.NO_WRAP));java.util.Arrays.fill(key,(byte)0);call.resolve(r);
        }catch(Exception e){call.reject("许可与设备不匹配或设备不支持此参数",e);}
    }
    @PluginMethod public void hasFormalRequest(PluginCall call) {
        String id=call.getString("requestId");
        boolean valid=id!=null && id.matches("[A-Za-z0-9-]{1,80}") && getContext().getSharedPreferences("lifesay-formal-requests-v3",0).getBoolean(id,false);
        JSObject r=new JSObject();r.put("known",valid);call.resolve(r);
    }
    @PluginMethod public void shareFormalRequest(PluginCall call) {
        try {
            if(!"org.aibaize.lifesay".equals(getContext().getPackageName()))throw new Exception("wrong application identity");
            KeyStore store=KeyStore.getInstance("AndroidKeyStore");store.load(null);
            if(!store.containsAlias(FORMAL_ALIAS)) {
                KeyPairGenerator gen=KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_RSA,"AndroidKeyStore");
                gen.initialize(new KeyGenParameterSpec.Builder(FORMAL_ALIAS,KeyProperties.PURPOSE_DECRYPT).setKeySize(2048)
                    .setDigests(KeyProperties.DIGEST_SHA256,KeyProperties.DIGEST_SHA1).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_RSA_OAEP).build());gen.generateKeyPair();
            }
            String requestId=UUID.randomUUID().toString();
            if(!getContext().getSharedPreferences("lifesay-formal-requests-v3",0).edit().putBoolean(requestId,true).commit())throw new Exception("Cannot save request identity");
            JSObject request=new JSObject();request.put("schema_version",3);request.put("product_id","aienglish");request.put("app_id","org.aibaize.lifesay");
            request.put("app_version",getContext().getPackageManager().getPackageInfo(getContext().getPackageName(),0).versionName);request.put("request_id",requestId);
            request.put("public_key_spki",Base64.encodeToString(store.getCertificate(FORMAL_ALIAS).getPublicKey().getEncoded(),Base64.NO_WRAP));
            if(Boolean.TRUE.equals(call.getBoolean("operationRequest",false))) {
                request.put("schema_version",4);
                request.put("protocol_revision","lifesay-device-request-v2-draft");
                request.put("project_id","aienglish");
                request.put("environment",(getContext().getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE)!=0?"test":"production");
                request.put("app_version_code",getContext().getPackageManager().getPackageInfo(getContext().getPackageName(),0).versionCode);
                java.text.SimpleDateFormat formatter=new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'",java.util.Locale.US);
                formatter.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
                request.put("request_created_at",formatter.format(new java.util.Date()));
                request.put("key_algorithm","RSA-2048-SPKI");
                JSObject capabilities=new JSObject();
                capabilities.put("license_protocols",new org.json.JSONArray().put("lifesay-license-v4").put("lifesay-license-v3"));
                capabilities.put("runtime_schemas",new org.json.JSONArray().put("lifesay-runtime-v1").put("lifesay-runtime-v2"));
                request.put("capabilities",capabilities);
                if(request.toString().getBytes(StandardCharsets.UTF_8).length>16384)throw new Exception("Request exceeds size limit");
            }

            File directory=new File(getContext().getCacheDir(),"formal-device-applications");if(!directory.exists()&&!directory.mkdirs())throw new Exception("Cannot prepare request");
            File output=new File(directory,"lifesay-device-request-"+requestId+".json");
            try(FileOutputStream stream=new FileOutputStream(output)){stream.write(request.toString().getBytes(StandardCharsets.UTF_8));}
            if(Boolean.TRUE.equals(call.getBoolean("saveToFile",false))) {
                call.getData().put("__formalExportFile",output.getName());
                getActivity().runOnUiThread(()->{try {
                    Intent save=new Intent(Intent.ACTION_CREATE_DOCUMENT);save.addCategory(Intent.CATEGORY_OPENABLE);save.setType("application/json");save.putExtra(Intent.EXTRA_TITLE,output.getName());
                    startActivityForResult(call,save,"saveFormalRequestResult");
                }catch(Exception error){call.reject("无法打开文件保存",error);}});
                return;
            }
            Uri uri=FileProvider.getUriForFile(getContext(),getContext().getPackageName()+".fileprovider",output);
            getActivity().runOnUiThread(()->{try {Intent intent=new Intent(Intent.ACTION_SEND);intent.setType("application/json");intent.putExtra(Intent.EXTRA_STREAM,uri);intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);getActivity().startActivity(Intent.createChooser(intent,"私密发送设备申请"));JSObject result=new JSObject();result.put("status","share_sheet_opened");call.resolve(result);}catch(Exception error){call.reject("无法打开系统分享",error);}});
        } catch(Exception e){call.reject("无法创建设备申请",e);}
    }

    @ActivityCallback private void saveFormalRequestResult(PluginCall call,ActivityResult result) {
        if(call==null)return;
        if(result.getResultCode()!=Activity.RESULT_OK||result.getData()==null||result.getData().getData()==null){JSObject r=new JSObject();r.put("status","cancelled");call.resolve(r);return;}
        try {
            String name=call.getString("__formalExportFile");
            if(name==null||!name.matches("lifesay-device-request-[A-Za-z0-9-]{1,80}\\.json"))throw new Exception("Invalid request filename");
            File directory=new File(getContext().getCacheDir(),"formal-device-applications");File source=new File(directory,name);
            if(!source.getCanonicalFile().getParentFile().equals(directory.getCanonicalFile())||source.length()>16384)throw new Exception("Invalid request file");
            try(FileInputStream in=new FileInputStream(source);OutputStream out=getContext().getContentResolver().openOutputStream(result.getData().getData(),"w")){
                if(out==null)throw new Exception("No writable document");byte[] buffer=new byte[4096];int count;while((count=in.read(buffer))!=-1)out.write(buffer,0,count);
            }
            JSObject r=new JSObject();r.put("status","saved");call.resolve(r);
        }catch(Exception error){call.reject("无法保存设备申请",error);}
    }
}
