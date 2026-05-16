import Order from "../models/Order.js";

export const createOrder = async(req,res)=>{

 try{

  const order = await Order.create(req.body);

  res.json({
    message:"Order Created",
    order
  });

 }catch(err){
  res.status(500).json(err);
 }

};

export const getOrders = async(req,res)=>{

 const orders = await Order.find();
 res.json(orders);

};