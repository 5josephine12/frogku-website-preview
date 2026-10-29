export const adminEmail='adminfrogku@gmail.com';
const locations=new Set(['Jakarta','Bogor','Depok','Tangerang','Bekasi']);
export const isServiceArea=location=>locations.has(location);
const copy={
 id:{application:'Pendaftaran Frogku',interest:'Minat Frogku di luar Jabodetabek',name:'Nama lengkap',phone:'Nomor HP',email:'Email',location:'Domisili',outside:'Di luar Jabodetabek',activity:'Aktivitas',confirmation:'Saya berusia minimal 18 tahun, memiliki KTP, dan HP Android atau iPhone.',intro:'Halo admin Frogku, saya ingin melanjutkan pendaftaran.',area:'Halo admin Frogku, saya ingin menanyakan ketersediaan layanan di wilayah saya. Saya memahami layanan saat ini hanya tersedia di Jabodetabek.',region:'Wilayah yang saya minati: '},
 en:{application:'Frogku application',interest:'Frogku interest outside Jabodetabek',name:'Full name',phone:'Phone number',email:'Email',location:'Location',outside:'Outside Jabodetabek',activity:'Activity',confirmation:'I am at least 18, have an Indonesian ID, and an Android phone or iPhone.',intro:'Hello Frogku team, I would like to continue my application.',area:'Hello Frogku team, I would like to ask about availability in my area. I understand service is currently limited to Jabodetabek.',region:'My area of interest: '},
 zh:{application:'Frogku 报名',interest:'Jabodetabek 以外地区的 Frogku 意向',name:'姓名',phone:'手机号',email:'邮箱',location:'居住地区',outside:'Jabodetabek 以外地区',activity:'活动',confirmation:'我已满 18 岁，持有印尼身份证，并拥有 Android 手机或 iPhone。',intro:'Frogku 管理员您好，我想继续报名。',area:'Frogku 管理员您好，我想咨询所在地区的服务开放情况。我了解服务目前仅覆盖 Jabodetabek。',region:'我希望开放的地区：'}
};
export function applicationDraft(values,{language='id',activityLabel=''}={}){
 const text=copy[language]||copy.id,available=isServiceArea(values.location);
 const subject=available?text.application:text.interest;
 const body=[available?text.intro:text.area,'',`${text.name}: ${values.full_name.trim()}`,`${text.phone}: ${values.phone.trim()}`,`${text.email}: ${values.email.trim()}`,`${text.location}: ${available?values.location:text.outside}`,`${text.activity}: ${activityLabel}`,'',text.confirmation,...(available?[]:['',text.region])].join('\r\n');
 return `mailto:${adminEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
