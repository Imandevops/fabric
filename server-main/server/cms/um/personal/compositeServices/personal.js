const { setContextInput } = require("../../../../utility/logging");
const { createPersonal, updatePersonal, loadPersonal, deletePersonal, loadPersonalPersonType, loadPersonalPaginate, loadPersonalSearch, getPersonal , crateTransaction } = require("../atomicServices/personal");
const { createError } = require("../../../../utility/error/errorHandling");
const { GlobalExceptions } = require("../../../../utility/error/exceptions");
const { loadPayment } = require("../../../../sunyar/operation/payment/atomicServices/payment");
const { loadNeedyAccounts } = require("../../../../sunyar/beneficiary/needyAccounts/atomicServices/needyAccounts");
const { loadNeedyToPlan } = require("../../../../sunyar/plan/needyToPlan/atomicServices/needyToPlan");
const { createUser, loadUser } = require("../../user/atomicServices/user");

const wsLoadPersonal = async (context) => {
    for (x in context.params) {
        if (context.params[x] == 'null') {
            context.params[x] = null
        }
    }
    context = await loadPersonal(setContextInput(context, context.params));
    context.result = context.output.map(p => {
        return {
            personId: p.personId,
            name: p.name,
            family: p.family,
            nationalCode: p.nationalCode,
            idNumber: p.idNumber,
            sex: p.sex,
            birthDate: p.birthDate,
            birthPlace: p.birthPlace,
            personPhoto : p.personPhoto,
            personType: p.personType,
            secretCode: p.secretCode
        }
    })
    return context;
}

const wsLoadPersonalSearch = async (context) => {
    context = await loadPersonalSearch(setContextInput(context, {
        page: context.params.page,
        name: context.params.name,
        family: context.params.family,
        nationalCode: context.params.nationalCode,
        sex: context.params.sex,
        personType: context.params.personType
    }
    ))
    context.result = context.output.rows.map(p => {
        return {
            personId: p.personId,
            name: p.name,
            family: p.family,
            nationalCode: p.nationalCode,
            idNumber: p.idNumber,
            sex: p.sex,
            birthDate: p.birthDate,
            birthPlace: p.birthPlace,
            personType: p.personType,
            secretCode: p.secretCode
        }
    })
    context.count = context.output.count;
    return context;
}

const wsLoadPersonalPersonType = async (context) => {

    for (x in context.params) {
        if (context.params[x] == 'null') {
            context.params[x] = null
        }
    }
    context = await loadPersonalPersonType(setContextInput(context, context.params));
    context.result = context.output.map(p => {
        return {
            personId: {
                personId: p.personId,
                personType: p.personType
            },
            name: p.name,
            family: p.family,
            nationalCode: p.nationalCode,
            idNumber: p.idNumber,
            sex: p.sex,
            birthDate: p.birthDate,
            birthPlace: p.birthPlace,
            personType: p.personType,
            personPhoto: p.personPhoto,
            secretCode: p.secretCode
        }
    })
    return context;
}

const wsLoadPersonalPaginate = async (context) => {
    for (x in context.params) {
        if (context.params[x] == 'null') {
            context.params[x] = null
        }
    }
    context = await loadPersonalPaginate(setContextInput(context, context.params));
    context.result = context.output.rows.map(p => {
        return {
            personId: p.personId,
            name: p.name,
            family: p.family,
            nationalCode: p.nationalCode,
            idNumber: p.idNumber,
            sex: p.sex,
            birthDate: p.birthDate,
            birthPlace: p.birthPlace,
            personType: p.personType,
            secretCode: p.secretCode
        };
    });
    context.count = context.output.count;
    return context;
}

const wsCreatePersonal = async (context) => {
    if(!context.auth) throw createError(GlobalExceptions.jwt.Forbidden);
    if(context.params.personType != 2 && context.auth.roles.includes("AID")) throw createError(GlobalExceptions.jwt.YouAID);
    
    let loadUniqFields = await loadPersonal(setContextInput(context, {
        nationalCode: context.params.nationalCode,
        personType: context.params.personType
    }))
    switch (true) {
        case (context.params.personType == 1):
            if (loadUniqFields.output[0] != null) {
                throw createError(GlobalExceptions.beneficiary.donatorError)
            }
            break;
        case (context.params.personType == 2):
            if (loadUniqFields.output[0] != null) {
                throw createError(GlobalExceptions.beneficiary.needyError)
            }
            break;
        case (context.params.personType == 3):
            if (loadUniqFields.output[0] != null) {
                throw createError(GlobalExceptions.beneficiary.personalError)
            }
            break;
    }
    context = await createPersonal(setContextInput(context, {
        name: context.params.name,
        family: context.params.family,
        nationalCode: context.params.nationalCode,
        idNumber: context.params.idNumber,
        sex: context.params.sex,
        birthDate: context.params.birthDate,
        birthPlace: context.params.birthPlace,
        personType: context.params.personType,
        personPhoto: context.params.personPhoto,
    }))
    context.result = { personId: context.output.personId };
    return context;
}
////////--------------------------------------------
const wsCreatePersonalAccount = async (context) => {

    let loadUniqFields = await getPersonal(setContextInput(context, {
        nationalCode: context.params.nationalCode,
        personType: context.params.personType
    }))
    switch (true) {
        case (context.params.personType == 1):
            if (loadUniqFields.output !== null) {
                throw createError(GlobalExceptions.beneficiary.personalError)
            }
            break;
        case (context.params.personType == 2):
            if (loadUniqFields?.output != null) {
                throw createError(GlobalExceptions.beneficiary.needyError)
            }
            break;
        case (context.params.personType == 3):
            if (loadUniqFields?.output != null) {
                throw createError(GlobalExceptions.beneficiary.donatorError)
            }
            break;
    }
    /// transaction---------------
    let isUserExists = await loadUser(setContextInput(context, { username: context.params.username, }))
    if (isUserExists.output == !null) {
        await deletePersonal(setContextInput(context, {
            personId: personal.output.personId,
        }))
        throw createError(GlobalExceptions.user.UserAlreadyExists)
    }

    context = await crateTransaction(setContextInput(context, { name: context.params.name,
            family: context.params.family,
            nationalCode: context.params.nationalCode,
            idNumber: null,
            sex: context.params.sex,
            birthDate: null,
            birthPlace: null,
            personType: context.params.personType,
            personPhoto: null,
            username: context.params.username,
            password: context.params.password,
            expireDate: context.params.expireDate,
            active: context.params.active
        }))
    // let personal = await createPersonal(setContextInput(context, {
    //     name: context.params.name,
    //     family: context.params.family,
    //     nationalCode: context.params.nationalCode,
    //     idNumber: context.params.idNumber,
    //     sex: context.params.sex,
    //     birthDate: context.params.birthDate,
    //     birthPlace: context.params.birthPlace,
    //     personType: context.params.personType,
    //     personPhoto: context.params.personPhoto,
    // }))

   
    // let user = await createUser(setContextInput(context, {
    //     personId: personal.output.personId,
    //     username: context.params.username,
    //     password: context.params.password,
    //     expireDate: context.params.expireDate,
    //     active: context.params.active
    // }))
    // if (!user.output) {
    //     await deletePersonal(setContextInput(context, {
    //         personId: personal.output.personId,
    //     }))
    // }

    context.result = {
        userId: context.output.userId,
    };
    return context;
}
/////------------------------------------------------------------
const wsUpdatePersonal = async (context) => {
    if(context.params.personType != 2 && context.auth.roles.includes("AID")){
        throw createError(GlobalExceptions.jwt.Forbidden)
    }
    
    let loadUniqFields = await loadPersonal(setContextInput(context, {
        nationalCode: context.params.nationalCode,
        personType: context.params.personType
    }))

    switch (true) {
        case (context.params.personType == 1):
            if (loadUniqFields.output[0] != null && loadUniqFields.output[0].personId != context.params.personId) {
                throw createError(GlobalExceptions.beneficiary.donatorError)
            }
            break;
        case (context.params.personType == 2):
            if (loadUniqFields.output[0] != null && loadUniqFields.output[0].personId != context.params.personId) {
                throw createError(GlobalExceptions.beneficiary.needyError)
            }
            break;
        case (context.params.personType == 3):
            if (loadUniqFields.output[0] != null && loadUniqFields.output[0].personId != context.params.personId) {
                throw createError(GlobalExceptions.beneficiary.personalError)
            }
            break;
    }

    context = await updatePersonal(setContextInput(context, {
        personId: context.params.personId,
        name: context.params.name,
        family: context.params.family,
        nationalCode: context.params.nationalCode,
        idNumber: context.params.idNumber,
        sex: context.params.sex,
        birthDate: context.params.birthDate,
        birthPlace: context.params.birthPlace,
        personType: context.params.personType,
        personPhoto: context.params.personPhoto,
        secretCode: context.params.secretCode
    }))
    context.result = context.output;
    return context;
}

const wsDeletePersonal = async (context) => {
    if(context.params.personType != 2 && context.auth.roles.includes("AID")){
        throw createError(GlobalExceptions.jwt.Forbidden)
    }
    context = await loadPayment(setContextInput(context, { needyId: context.params.personId }))
    if (context.output[0]) {
        throw createError(GlobalExceptions.dependecyError)
    }
    context = await loadPayment(setContextInput(context, { donatorId: context.params.personId }))
    if (context.output[0]) {
        throw createError(GlobalExceptions.dependecyError)
    }
    context = await loadNeedyAccounts(setContextInput(context, { needyId: context.params.personId }))
    if (context.output[0]) {
        throw createError(GlobalExceptions.dependecyError)
    }
    context = await loadNeedyToPlan(setContextInput(context, { needyId: context.params.personId }))
    if (context.output[0]) {
        throw createError(GlobalExceptions.dependecyError)
    }
    context = await deletePersonal(setContextInput(context, context.params));
    if (context.output === 0) {
        throw createError(GlobalExceptions.beneficiary.personNotFound)
    }
    context.result = context.output;
    return context;
}


module.exports = { wsCreatePersonal, wsUpdatePersonal, wsLoadPersonal, wsDeletePersonal, wsLoadPersonalPersonType, wsLoadPersonalPaginate, wsLoadPersonalSearch, wsCreatePersonalAccount };