
const db = require('../../../../config/dbIndex');
const { dbErrorHandling } = require('../../../../utility/error/dbError');
const { setContextOutput } = require('../../../../utility/logging');

const Payment = db.tblPayment;



const loadSumSettelment = async (context) => {
    try {
        return await setContextOutput(context, await Payment.findAll(
        { where : context.input,
            attributes: [
            [db.sequelize.fn('SUM', db.sequelize.col('paymentPrice')),'totalPaymentPrice']]                
            } ))
    } catch (error) {
        await dbErrorHandling(error, context);

    }

}

const createSettelment = async (context) => {
    try {
        return setContextOutput(context, await Payment.create({
          
            cashAssistanceDetailId : context.input.cashAssistanceDetailId,
            paymentPrice : context.input.paymentPrice,
            paymentGatewayId : context.input.paymentGatewayId,
            paymentDate : context.input.paymentDate,
            paymentTime : context.input.paymentTime,
            paymentStatus : context.input.paymentStatus,
            sourceAccoutNumber : context.input.sourceAccoutNumber,
            targetAccountNumber : context.input.targetAccountNumber,
            charityAccountId : context.input.charityAccountId,
            followCode : context.input.followCode,
            needyId : context.input.needyId,
        }));
    } catch (error) {
        await dbErrorHandling(error, context);
    }
        return context;
}

const loadSettelment = async (context) => {   
    try {
      
        return await setContextOutput(context, await Payment.findAll(
        { where : context.input ,
            include : [{
                model: db.tblCashAssistanceDetail,
                required: true ,
            } ,{
                model: db.tblCharityAccounts,
                required:false,  
            },{
                model: db.tblPersonal,
                required:false,
                as : "donator"
            },
            {
                model: db.tblPersonal,
                required:false,
                as : "needy"
            }]
                           
            } ))
    } catch (error) {

        await dbErrorHandling(error, context);

    }

}



const deleteSettelment = async (context) => {
    try {
        return await setContextOutput(context, await Payment.destroy({ where: { paymentId : context.input.paymentId } }))
    } catch (error) {
        await dbErrorHandling(error, context);
    }
}




module.exports = { createSettelment , loadSumSettelment, deleteSettelment , loadSettelment };



