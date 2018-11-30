const CustomValidator = require('./custom-validator')
const DataValidator = require('./data.validator')

class Schema {
    constructor(schema, defaults = {}){
        this._schema = schema
        this._schemaMap = {}
        
        defaults = this._schema.$defaults || defaults || {}
        delete (this._schema.$defaults)

        this.each((path, item) => {
            if (!item.type){
                item = {type: item}
            }

            item.type = typeToString(item.type)
            for (let k in defaults){
                if (item.type && item[k]==undefined){
                    item[k] = defaults[k]
                }
            }

            this._schemaMap[path] = item
        })

        function typeToString(value){
            let r = value

            switch (value) {
                case String: r = 'String'; break
                case Boolean: r = 'Boolean'; break
                case Number: r = 'Number'; break
                case Date: r = 'Date'; break
                case Array: r = 'Array'; break
                case Object: r = 'Object'; break
            }

            return r.toLowerCase()
        }
    }

    /**
     * @param {*} json 
     * @param {String} path deve começar com / 
     */
    static find(json, path){
        let attributes = path.split('/')
        let length = attributes.length
        let doFind = (obj, index) => {
            let attr = attributes[index]
            let value = obj[attr]

            index++

            if (index == length){
                return value
            }

            if (value != undefined){
                return doFind(value, index)
            }

        }

        return doFind(json, 1)
    }
    
    validate(json, successfn, errorfn){
        let value, def, error
        let self = this
        let jsonMap = {}
        let schemaMap = this._schemaMap
        let analized = {}
        
        function requeridValidations(defPath, valuePath){
            let i, j
            let value = jsonMap[valuePath]
            let def = self._schemaMap[defPath]
            
            if (analized[defPath]){
                return
            }

            analized[defPath] = true

            if (def.required){
                if (value===undefined){
                    error = {
                        path: valuePath,
                        message: `attribute required [${valuePath.substr(valuePath.lastIndexOf('/')+1)}]`
                    }

                    return 
                }
            }

            if (value && def.type == 'array'){
                
                for (i=0; i<value.length; i++){
                    def = self._schemaMap[`${defPath}/$items`]
                    
                    if (def.type == 'object'){
                        requeridValidations(`${defPath}/$items`, `${defPath}/0`)
                        if (error) return

                        for (j in def.properties){
                            requeridValidations(`${defPath}/$items/${j}`, `${defPath}/${i}/${j}`)
                            if (error) return
                        }

                    } else if (def.type == 'array'){
                        requeridValidations(`${defPath}/$items`, `${valuePath}/${i}`)
                    } else {
                        requeridValidations(`${defPath}/$items`, `${valuePath}/${i}`)
                    }

                    if (error) return
                }
            }
        }

        function baseValidations(obj, p1, p2){
            let r, key, path1, path2

            if (Array.isArray(obj)){
                for (key in obj){
                    path1 = `${p1}/$items`
                    path2 = `${p2}/${key}`
                    value = obj[key]
                    def = schemaMap[path1]
                    
                    r = doBaseValidations(value, def, path1, path2, key)

                    if (r){
                        return r
                    }
                }

            } else {
                for (key in obj){
                    path1 = `${p1}/${key}`
                    path2 = `${p2}/${key}`
                    value = obj[key]
                    def = schemaMap[path1]
                    
                    r = doBaseValidations(value, def, path1, path2, key)

                    if (r){
                        return r
                    }
                }
            }
        }

        function doBaseValidations(value, def, path1, path2, key){
            let fn, i

            jsonMap[path2] = value

            if (value == undefined){
                return
            }
            
            if (!def){
                return {
                    path: path2,
                    message: `unknown attribute [${key}] (not in schematic)`
                }

            } else {
                fn = DataValidator[def.type]
                
                if (fn && !fn(value)) {
                    return {
                        path: path2,
                        message: `invalidate datatype: expected "${def.type}"`
                    }

                } else {
                    for (i in def){
                        fn = CustomValidator[i]
                        if (fn && !fn(def, value, key, path1, json, self)){
                            return {
                                path: path2,
                                message: `invalidate data: rule[${i}:${def[i]}]`
                            }
                        }
                    }
                }
            }

            if (typeof value == 'object'){
                return baseValidations(value, path1, path2)
            }
        }

        error = baseValidations(json, '', '')
        
        if (!error){
            for (let path in this._schemaMap) {
                requeridValidations(path, path)
                if (error) break
            }
        }

        if (error){
            if (errorfn) errorfn(error)
            return error
        } else {
            if (successfn) successfn()
            return true
        }
    }

    definition(path){
        let attributes = path.split('/')
        let length = attributes.length
        let cache = this._cache[path]
        let getValue = (obj, index) => {
            let attr = attributes[index]
            let value = attr == '$item' && obj.$item ? obj.$item[0] : obj[attr]

            index++

            if (index == length){
                this._cache[path] = {value}
                return value
            }

            if (value != undefined){
                return getValue(value, index)
            }

        }

        return cache ? cache.value : getValue(this._schemaMap, 0)
    }

    each(fn){

        Object.keys(this._schema).forEach(key => {
            each(this._schema[key], `/${key}`)
        })

        function each(item, path){
            fn(path, item)
    
            if (item.properties){
                Object.keys(item.properties).forEach(key => {
                    each(item.properties[key], `${path}/${key}`)
                })
            }
    
            if (item.items && item.type.includes('array')){
                each(item.items, `${path}/$items`)
            }
        }
    }
}

module.exports = {
    Schema,
    CustomValidator
}
