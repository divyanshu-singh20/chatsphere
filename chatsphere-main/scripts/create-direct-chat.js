const fs = require('fs');
const fetch = global.fetch || require('node-fetch');
const base = process.env.BASE_URL || 'http://localhost:5003';
(async ()=>{
  try{
    const login = async (email)=>{
      const res = await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identifier:email,password:'Password@123'})});
      const data = await res.json();
      if(!res.ok) throw new Error('login failed '+JSON.stringify(data));
      return data;
    };
    const maya = await login('maya@chatsphere.app');
    const kabir = await login('kabir@chatsphere.app');
    // create direct chat as maya
    const createRes = await fetch(base+'/api/chats/direct',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+maya.token},body:JSON.stringify({userId:kabir.user.id})});
    const createData = await createRes.json();
    if(!createRes.ok) throw new Error('create chat failed '+JSON.stringify(createData));
    const out = { maya, kabir, chat: createData.chat };
    fs.writeFileSync('scripts/create-direct-chat-output.json', JSON.stringify(out,null,2));
    console.log('wrote scripts/create-direct-chat-output.json');
  }catch(err){
    fs.writeFileSync('scripts/create-direct-chat-output.json', JSON.stringify({error:String(err)},null,2));
    console.error(err); process.exit(1);
  }
})();
