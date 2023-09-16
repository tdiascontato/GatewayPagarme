import {Router} from "express";

import CartsController from "./controllers/CartsController";
import TransactionsController from "./controllers/TransactionsController";
import PostbackController from "./controllers/PostbackController";

const routes = new Router();

routes.get('/carts', CartsController.index);
routes.post('/carts', CartsController.create);
routes.put('/carts/:id', CartsController.update);
routes.delete('/carts/:id', CartsController.destroy);

routes.post('/transactions', TransactionsController.create);

routes.post('/postbacks/pagarme', PostbackController.pagarme);

export default routes;