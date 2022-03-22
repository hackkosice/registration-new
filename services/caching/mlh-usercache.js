
module.exports = class MyMLHUserCache {

    constructor(mymlh) {
        this.#mymlh = mymlh;
    }

    async build() {

        //Because MyMLH is hella stupiid... you need to rebuild whole cache! At every miss!
        //But at least i can binary search thru dat shit
        //just so we can get metadata about user count
        const metadata = await this.#mymlh.get_users(1, 1);

        let requests = [];

        for (let i = 0; i < Math.ceil(metadata.pagination.results_total / 250); i++) {
            requests.push(new Promise(async (resolve, reject) => {
                    const users = await this.#mymlh.get_users(250, i);
                    for (const user of users.data) this.#cache.set(user.id, user);
                    resolve();
                })
            );
        }

        try {
            await Promise.all(requests);
        } catch (err) {
            return null;
        }

    }

    async get(uid) {

        let user = this.#cache.get(uid);

        //Miss?
        if (typeof user === 'undefined') {

            //Check if cache length changed
            const cache_len = await this.#mymlh.get_users(1, 1);
            if (this.#cache.size == cache_len.pagination.results_total)
                return { //Cache miss and cache size didn't change
                    error: "Given user does not exist!"
                };

            //Rebuild cache
            await this.build();

            user = this.#cache.get(uid);
            if (typeof user === 'undefined')
                return { //Cache miss and cache size changed
                    error: "Given user does not exist!"
                };
        }

        //Hit
        return user;
    }

    #cache = new Map();
    #mymlh = null;
}