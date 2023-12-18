class Socket {
	constructor() {
		this.socketConntection = null;
	}

	setConnection = (io) => {		
		this.socketConntection = io;
	};

	getConnection = () => {
		return this.socketConntection;
	};

	emit = (eventName, eventData) => {
		this.socketConntection?.emit(eventName, eventData);
	};

	emitToCity = (cityId, eventData) => {
		this.socketConntection.emit(`cityLg_${cityId}`, eventData);
	};
}

const socket = new Socket();

module.exports = socket;