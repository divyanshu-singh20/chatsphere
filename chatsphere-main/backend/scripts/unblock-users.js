import 'dotenv/config';
import { User, sequelize } from '../models/index.js';
(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');
    const emails = ['maya@chatsphere.app','kabir@chatsphere.app'];
    for(const email of emails){
      const user = await User.findOne({ where: { email } });
      console.log('found', email, !!user);
      if(user){
        user.status = 'approved';
        user.role = user.role || 'user';
        user.isOnline = false;
        await user.save();
        console.log('updated', email, user.status);
      }
    }
    await sequelize.close();
    console.log('done');
  } catch (err) {
    console.error(err);
    try{await sequelize.close();}catch(e){}
    process.exit(1);
  }
})();
