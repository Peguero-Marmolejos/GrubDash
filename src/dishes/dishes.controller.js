const path = require("path");
// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));
// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");
const hasProperties = require("../errors/hasProperties");
const hasNecessaryProperties = hasProperties('name', 'description', 'price', 'image_url' );
// TODO: Implement the /dishes handlers needed to make the tests pass

function list(req, res) {
    res.json({ data: dishes });
}

function create(req, res){
    const {data} = req.body;
    data.id = nextId();
    const newDish = data;
    dishes.push(newDish);
    res.status(201).json({data: newDish});
}

function read(req, res) {
    res.json({ data: res.locals.dish });
}

function update(req, res, next) {
  let dish = res.locals.dish;
  let dishBody = req.body.data;
  dishBody.id = dish.id;
  res.locals.order = dishBody;
  res.json({data: res.locals.order})
}

//VALIDATION MIDDLE WARE

function dishExists(req, res, next) {
    const dishId = req.params.dishId;
    const foundDish = dishes.find((dish) => dish.id === dishId);
  
    if (foundDish === undefined) {
      return next({
        status: 404,
        message: `Dish does not exist: ${dishId}`,
      });
    }
    res.locals.dish = foundDish;
    next();
}

function hasValidProperties(req, res, next) {
    const {data: { name, description, price, image_url }} = req.body;
    if (name.length && description.trim().length && image_url.trim().length && typeof price === 'number' && price > 0) {
        next();
    }
    next({ status: 400, message: "A price property is required." });
}

function idMatches(req, res, next){
    const dishId = req.params.dishId;
	const { data: { id } = '' } = req.body;
    if(id === dishId || id === '' || id === null || id === undefined ){
      next();
    }
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
}

module.exports = {
    create: [hasNecessaryProperties, hasValidProperties, create],
    list,
      read: [dishExists, read],
    update: [dishExists,idMatches, hasNecessaryProperties, hasValidProperties, update],
  };