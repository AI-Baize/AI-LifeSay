export type FormalLicense={schema:string;request_id:string;license_id:string;product_id:string;app_id:string;device_fingerprint:string;perpetual:boolean;environment?:string;project_id?:string;levels:{level_id:string;level_version:string;manifest_hash:string;wrapped_lk:string}[]};
// Pinned signature verification is performed by the caller before using this validator.
export function validateFormalLicense(value:unknown,expectedEnvironment?:string):FormalLicense{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('许可结构无效');
 const l=value as FormalLicense;
 if(!['lifesay-license-v3','lifesay-license-v4'].includes(l.schema)||l.product_id!=='aienglish'||l.app_id!=='org.aibaize.lifesay'||l.perpetual!==true||typeof l.device_fingerprint!=='string'||typeof l.request_id!=='string'||typeof l.license_id!=='string'||!/^[a-f0-9]{64}$/.test(l.device_fingerprint)||!/^[A-Za-z0-9-]{1,80}$/.test(l.request_id)||!/^[A-Za-z0-9-]{1,80}$/.test(l.license_id)||!Array.isArray(l.levels)||!l.levels.length||l.levels.length>50)throw Error('许可结构无效');
 if(l.schema==='lifesay-license-v4'&&(l.project_id!=='aienglish'||!['test','production'].includes(expectedEnvironment??'')||l.environment!==expectedEnvironment))throw Error('许可项目或环境不匹配');
 const seen=new Set<string>();for(const row of l.levels){
  if(!row||typeof row.level_id!=='string'||typeof row.manifest_hash!=='string'||!/^SG0[1-3]\.0[1-4]$/.test(row.level_id)||seen.has(row.level_id)||typeof row.level_version!=='string'||!/^[A-Za-z0-9._-]{1,80}$/.test(row.level_version)||!/^[a-f0-9]{64}$/.test(row.manifest_hash)||typeof row.wrapped_lk!=='string'||!/^[A-Za-z0-9+/]{342}==$/.test(row.wrapped_lk))throw Error('许可小级描述无效');seen.add(row.level_id);
 }
 return l;
}
