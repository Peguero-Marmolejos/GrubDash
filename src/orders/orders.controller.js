const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

//Validates weather a res.body contains the given properties
const hasProperties = require("../errors/hasProperties");
const hasPropertiesPresent = hasProperties("deliverTo" , "mobileNumber" , "dishes");

function list(req, res, next) {
  res.json({ data: orders });
}

function read(req, res, next) {
  const { order } = res.locals;
  res.json({ data: order });
}

function create(req, res, next) {
    const {data} = req.body;
    data.id = nextId();
    const newOrder = data;
    orders.push(newOrder);
    res.status(201).json({data: newOrder});
}

function update(req, res, next) {
  let order = res.locals.order;
  let orderBody = req.body.data;
  orderBody.id = order.id;
  res.locals.order = orderBody;
  res.json({data: res.locals.order})
}

function destroy(req, res, next){
  const {orderId} = req.params
  const index = orders.findIndex((order) => Number(order.id) === Number(orderId))
  const deletedOrders = orders.splice(index, 1)
  res.sendStatus(204)
}

//VALIDATIONS

function orderIdExists(req, res, next) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    next();
  }
  next({ status: 404, message: `No matching order found: ${orderId}` });
}

//iterate  w/ for each or for loop
function dishesPropertyValidation(req, res, next) {
  const { data: { dishes },  } = req.body;
   if(dishes.length <= 0 || !Array.isArray(dishes)){
    next({ status: 400, message: "Order must include at least one dish" });
   }else{
    for (let i = 0; i < dishes.length; i++) {
      let quantity = dishes[i].quantity;
      if (!Number.isInteger(quantity) || quantity <= 0){
        next({
          status: 400,
          message: `Dish ${i} must have a quantity that is an integer greater than 0`,
        });
      }
    }
  }
  next();
}

function statusPropertyValidation(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (status === "" || !status|| status === "invalid" ) {
    next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery,delivered",
    });
  }
  next();
}

function dataMatchCheck( req, res, next){
    const { order } = res.locals;
    const { data: { id } = {} } = req.body;
    if (id === order.id || id === null || !id){
        next()
    }
    next({status: 400, message: `Order id does not match route id. Order: ${id}, Route: ${order}.`})
}

function statusPendingValidation(req, res, next){
  const order = res.locals.order;
  if (order.status !== "pending") {
      next({
        status: 400,
        message: "An order cannot be deleted unless it is pending",
      });
    } 
    next()
}

module.exports = {
  list,
  read: [orderIdExists, read],
  create: [
    hasPropertiesPresent,
    dishesPropertyValidation,
    create,
  ],
  update: [
    orderIdExists,
    hasPropertiesPresent,
    dishesPropertyValidation,
    statusPropertyValidation,
    dataMatchCheck,
    update,
  ],
  delete: [orderIdExists, statusPendingValidation, destroy],
};

