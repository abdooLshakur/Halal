const bcrypt = require('bcryptjs');
const Users = require("../models/UserModel")

const CreateUser = async(req, res) => {
    try {
      const {first_name,last_name,email,phone,password,gender } = req.body;
        const check_user = await Users.findOne({email});
        if(check_user){
            res.json({
                success: false,
                messae: "Email Already Exists",
            });
            return
        }
        const avatarPath = req.file ? req.file.path : null;
        const encrypt_password = await bcrypt.hash(password, 12);
        const New_member = {first_name,last_name,email,phone,gender,password: encrypt_password, avatar:avatarPath };
        const New_user = await new Users(New_member).save();
        res.json({
            success: true,
            message: "User created Successfully",
            data: New_user
        });
    } catch (err) {
        res.json({
            success: false,
            message: "Failed to create user",
            error: err.message,
        })
    }
};

const loginUser = async (req, res) =>{
  try {
    const {email, password} = req.body;
    const checkExists = await Users.findOne({email});
    if(!checkExists){
      res.json({
        success: false,
        message: "Email / user not found",
        });
        return
        }
        const savedpassword = checkExists.password;
        const isMatch = await bcrypt.compare(password, savedpassword);
        if(!isMatch){
          res.json({
          success: false,
          message: "invalid  password",
          })
          return;
}
res.json({
  success:true,
   message: "login sucessfully", 
  data: {id: checkExists._id, first_name: checkExists.first_name, last_name: checkExists.last_name, email: checkExists.email, phone: checkExists.phone, gender: checkExists.gender}})
  }catch (err){
    res.json({error: err.message})
  }

}

const getAllUsers = (req, res) => {
  const isLoggedIn = req.user && req.user.isAuthenticated;

  if (!isLoggedIn) {
    return res.status(401).json({
      success: false,
      message: "Merchant or Admin not logged in",
    });
  }
  Users.find({}, {password: 0, __v: 0})
    .then((resp) => {
      res.json({
        success: true,
        message: "All Users",
        data: resp,
      });
    })
    .catch((err) => {
      res.json({
        success: false,
        message: "Failed to Fetch users",
        error: err.massage,
      });
    });
};

const getsingleUser = (req, res) => {
  const isLoggedIn = req.user && req.user.isAuthenticated;

  if (!isLoggedIn) {
    return res.status(401).json({
      success: false,
      message: "Merchant or Admin not logged in",
    });
  }
  const id = req.params.user_id;
  Users.findOne(id,{}, {password: 0, __v: 0})
    .then((resp) => {
      res.json({
        success: true,
        message: "All Users",
        data: resp,
      });
    })
    .catch((err) => {
      res.json({
        success: false,
        message: "Failed to Fetch users",
        error: err.massage,
      });
    });
};

const updateUser = async (req, res) => {
  const isLoggedIn = req.user && req.user.isAuthenticated;

  if (!isLoggedIn) {
    return res.status(401).json({
      success: false,
      message: "Merchant or Admin not logged in",
    });
  }
 try {
  const id = req.params.id;
  const avatarPath =  req.file ? req.file.path : null;
  const resp = await Users.findByIdAndUpdate(
    id,
    {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      gender: req.body.gender,
      phone: req.body.phone,
      avatar: avatarPath,
    },
    { new: true }
  )
  res.json({
    success: true,
    message: "User Updated Successfully",
    data: resp,
  });
 } catch (err) {
  res.json({
    success: false,
    message: "Failed to Update user",
    error: err.massage,
  });
 }
    
   
   
};

const deleteUser = (res, req) => {
  const isLoggedIn = req.user && req.user.isAuthenticated;

  if (!isLoggedIn) {
    return res.status(401).json({
      success: false,
      message: "Merchant or Admin not logged in",
    });
  }
  const id = req.params.id;
  Users.findByIdAndDelete(id)
    .then(() => {
      res.json({
        success: true,
        message: "User Deleted Successfully",
      });
    })
    .catch((err) => {
      res.json({
        success: false,
        message: "Failed to Delete user",
        error: err.massage,
      });
    });
};

module.exports = {
  CreateUser,
  loginUser,
  getAllUsers,
  updateUser,
  getsingleUser,
  deleteUser
};