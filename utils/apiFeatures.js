
class APIFeatures{
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter(){
        const queryObject = {...this.queryString};
        const excludes = ['fields', 'sort', 'limit', 'page', 'search'];
        excludes.forEach(excluded => {
            delete queryObject[excluded];
        })

        let queryStr = JSON.stringify(queryObject);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

        this.query = this.query.find(JSON.parse(queryStr));

        return this;

    }

    search(){

        if(this.queryString.search){
            if(typeof this.queryString.search !== "string"){
                const key = Object.keys(this.queryString.search)[0];
                const value = this.queryString.search[key];
                const regex = new RegExp( value, 'i');
                this.query = this.query.find({ [key] : regex});
            }
        }

        return this;


    }

    sort(){
        if(this.queryString.sort){
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        }

        return this;
    }

    paginate(){
        if(this.queryString.page && this.queryString.limit) {
            const page = this.queryString.page * 1 || 1;
            const limit = this.queryString.limit * 1 || 100;
            const skip = (page - 1) * limit;

            this.query = this.query.skip(skip).limit(limit);
        }


        return this;
    }

    limitFields(){
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');
        }


        return this;
    }




}

module.exports = APIFeatures;