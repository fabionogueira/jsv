module.exports = {
    allowBlank(def, value, attribute, path, json, schema){
        let blank = Boolean(value)

        return def.allowBlank ? true : blank
    },
    max(def, value, attribute, path, json, schema){
        let length = (def.type=='string' ? (value || '').length : value)

        return length <= def.max
    },
    min(def, value, attribute, path, json, schema){
        let length = (def.type=='string' ? (value || '').length : value)

        return def.allowBlank && value == '' ? true : length >= def.min
    },
    count(def, value, attribute, path, json, schema){
        return value.length == def.count
    }
}
