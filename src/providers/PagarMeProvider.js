import {cpf} from "cpf-cnpj-validator";
import pagarme from "pagarme";

class PagarMeProvider{
    async process({
        transactionCode,
        total,
        paymentType,
        installments,
        creditCard,
        customer,
        billing,
        items,
    }){

        const billetParams = {
            payment_method: "boleto",
            amount: total * 100,
            installments: 1,
        };

        const  creditsCardParams = {
            payment_method: "credit_card",
            amount: total * 100,
            installments,
            card_holder_name: creditCard.holderName,
            card_number: creditCard.number.replace(/[^?0-9]/g, ""),
            card_expiration_date: creditCard.expiration.replace(/[^?0-9]/g, ""),
            card_cvv: creditCard.cvv,
            capture: true,
        }

        let paymentParams;
        switch(paymentType){
            case "credit_card":
                paymentParams = creditsCardParams;
                break;
            case "billet":
                paymentParams = billetParams;
                break;
            default:
                throw `PaymentType ${paymentType} not found.`;
                break;
        }

        const customerParams = {
            customer:{
                external_id: customer.email,
                name: customer.name,
                email: customer.email,
                type: cpf.isValid(customer.document) ? "individual" : "corporation",
                country: "br",
                phone_number: [customer.mobile],
                documents: [
                    {
                        type: cpf.isValid(customer.document) ? "cpf" : "cnpj",
                        number: customer.document.replace(/[^?0-9]/g,""),
                    },
                ],
            },
        };

        const billingParams = billing?.zipcode ? {
            billing:{
                name: "Billing Address",
                address: {
                    country: "br",
                    state: billing.state,
                    city: billing.city,
                    neighborhood: billing.neighborhood,
                    street: billing.address,
                    street_number: billing.number,
                    zipcode: billing.zipcode.replace(/[^?0-9]/g, ""),
                },
            },
        } : {};
        
        const itemsParams = items && items.length > 0 ? { 
            items: items.map((item) => ({
                id: item?.id.toString(),
                title: item?.title,
                unit_price: item?.amount * 100,
                quantity: item?.quantity || 1,
                tangible: false,
            }))
        } : { 
            items:[
                {
                    id: "1",
                    title: `t-${transactionCode}`,
                    unit_price: total * 100,
                    quantity: 1,
                    tangible: false,
                },
            ],
        };

        const metadataParams = {
            metadata:{
                transaction_code: transactionCode,
            },
        };

        const transactionParams = {
            async: false,
            postback_url: process.env.PAGARME_WEBHOOK_URL,
            ...paymentParams,
            ...customerParams,
            ...billingParams,
            ...itemsParams,
            ...metadataParams,
        };

        const client = await pagarme.client.connect({
            api_key: this.process.env.PAGARME_API_KEY,
        });

        const response = await client.transactions.create(transactionParams)

        return{//Retornar neste formato para outros gateways
            transactionId: response.id,
            status: this.translateStatus(response.status),
            billet: {
                url: response.boleto_url,
                barCode: response.boleto_barcode,
            },
            card:{
                id: response.card?.id,
            },
            processorResponse: JSON.stringify(response),
        };
    }

    translateStatus(status){
        const statusMap = {//Status PagarMe : Meu Status
            processing: "processing",
            waiting_payment: "pending",
            authorized: "pending",
            paid: "approved",
            refused: "refused",
            pending_refund: "refunded",
            refunded: "refunded",
            chargedback: "chargeback",
        };
        return statusMap[status];
    }
}
export default PagarMeProvider;