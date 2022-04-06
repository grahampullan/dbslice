class Watched{

    constructor(){

        this.observers=[];

    }

    set store(value){

        this._store = value;
        this.observers.forEach( (observer) => {
            observer();
        } );

    }  

    get store(){
        return this._store;
    }

    subscribe(observer) {

        this.observers.push(observer);

    }

    unsubscribe(observer) {

        this.observers = this.observers.filter(item => item !== observer)

    }

}

export { Watched };