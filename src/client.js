"use strict";

const { LK_ORGNAME, LK_USERNAME, LK_PASSWORD, LK_BOARDID } = process.env;
const axios = require( "axios" );
const qs = require( "querystring" );

const getClient = () => {
	const boardId = LK_BOARDID;
	const baseURL = `https://${ LK_ORGNAME }.leankit.com/io`;
	const auth = {
		username: LK_USERNAME,
		password: LK_PASSWORD
	};

	const api = axios.create( {
		baseURL,
		auth,
		headers: { 
			"Content-Type": "application/json",
			"Accept": "application/json"
		}
	} );

	const getBoard = async () => {
		const res = await api( `board/${ boardId }` );
		return res.data;
	};

	const getCards = async () => {
		const params = {
			limit: 200,
			offset: 0
		};
		const res = await api( `board/${ boardId }/card?${ qs.stringify( params ) }` );
		return res.data.cards;
	};

	return {
		getBoard,
		getCards
	};
};

const getCardsWithDates = async () => {
	try {
		const client = getClient();
		const board = await client.getBoard();
		const cards = await client.getCards();
		const plannedCards = cards
			.filter( card => !!card.plannedFinish || !!card.plannedStart )
			.map( card => {
				const lane = board.lanes.find( lane => lane.id === card.laneId );
				const parentLane = board.lanes.find( pl => pl.id === lane.parentLaneId );
				return {
					id: card.id,
					title: card.title,
					start: card.plannedStart,
					finish: card.plannedFinish,
					type: card.cardType.name,
					lane: parentLane ? parentLane.name + " > " + lane.name : lane.name, //card.laneId,
					assignedUsers: card.assignedUsers.map( user => user.fullName ).join( ", " ),
					url: `https://${ LK_ORGNAME }.leankit.com/card/${ card.id }`,
					updatedOn: card.updatedOn
				};
			} );
		return plannedCards;
	} catch ( err ) {
		console.log( err );
	}
};

module.exports = {
	getCardsWithDates
};
