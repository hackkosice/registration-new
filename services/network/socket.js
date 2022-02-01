const wss       = require("websocket");
const crypto 	= require("crypto");


module.exports = class WebSocketConnection {
	


	/* different types of messages that could be recived
		{
			type: "response",
			reqid: "(16 bytes, crypto-random)",
			body: {}
		},

		{
			type: "request",
			response: true,
			reqid: "(16 bytes, crypto-random)"
			body: {}
		},

		{
			type: "request",
			response: false, 
			body: {}
		}
	*/
	constructor(httpServer) {
		if (httpServer == null) //Also catches undefined
			return;

		this.#wss = new WebSocketServer({noServer: true});

		//Handle user's attempt to connect
		httpServer.on("upgrade", (request, socket, head) => {
			this.#wss.handleUpgrade(request, socket, head, function(ws) {
				this.#wss.emit("connection", ws, request);
			});
		});

		this.#wss.on("close", function() {
			//TODO: socket is closing
		});

		//Handle user's connection
		this.#wss.on("connection", function(ws) {


			ws.on("message", async (msg) => {

				let payload = {};

				try {
					payload = JSON.parse(msg);
				} catch(err) {
                	//If recived JSON is invalid, exit
                	return;
				};


				

				if (payload.type === "response") {
					
					let answer = this.#awaiting_answer.get(payload.reqid);
					
					if (answer === undefined)
						return;

					answer.promise.resolve(payload.body);
					this.#awaiting_answer.delete(payload.reqid);
					return;
				}

				else {

				}
			});
		});

		setInterval(() => {
			//Clear any requests that timed-out
		}, 5 * 1000 * 1000);
	}


	//TODO: Somehow get the websocket
	send_request = function(ws, body, await_response) {
		
		return new Promise((resolve, reject) => {

			//If answer is not needed (update, etc...)
			//Send the message
			if (!await_response) 
				return resolve(ws.send(JSON.parse({
					type: "request",
					response: false, 
					body: body
				})));

			let id = "";
			
			do {
				//Generate the random ID
				id = crypto.randomBytes(8).toString('base64');
			} while(this.#awaiting_answer.has(id));




		});
	}

	#awaithing_answer = new Map();
	#wss = null;
}