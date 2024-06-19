class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something Went Wrong",
        errors = [],
        stack = ""
    ){ 
        super(message) // overrde kar rhe hai message ko
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false // we are handling API errors and not API responses.
        this.errors = errors

        if(stack){
            this.stack = stack
        }else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {ApiError}