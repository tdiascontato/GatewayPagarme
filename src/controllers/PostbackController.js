import Transaction from "../models/Transaction";
import TransactionService from "../services/TransactionService";

class PostbackController{
    async pagarme(req, res){
        
        const {id, object, current_status} = req.body;
        //docs pagarme -> pagarme.postback.verifySignature('apiKey', 'postbackBody', 'X-Hub-Signature')

        try{
            if(object === "transaction"){
                const transaction = await Transaction.findOne({transactionId: id});

                if(!transaction){
                    return res.status(404).json();
                }

                const service = new TransactionService();
                await service.updateStatus({
                    code: transaction.code, 
                    providerStatus: current_status});

                return res.status(200).json();
            }
        }catch(err){
            console.error(err);
            return res.status(500).json({error: "Internal server error."});
        }
    }
}
export default new PostbackController();