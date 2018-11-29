module.exports = {
    date(input){
        if (typeof input == 'string'){
            if (input.split('-').length != 3){
                return false
            }

            return isNaN(Date.parse(input)) ? false : true
        }

        return input instanceof Date
    },
    array(input) {
        return Array.isArray(input)
    },
    number(input){
        return typeof input == 'number'
    },
    object(input){
        return input != null && Object.prototype.toString.call(input) == '[object Object]'
    },
    string(input){
        return typeof input == 'string'
    },
    boolean(input){
        return typeof input == 'boolean'
    }
}
