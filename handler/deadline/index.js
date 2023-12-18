const sequelize = require("#utils/dbConnection");
const { QueryTypes } = require("sequelize");

const getNextDeadline = async (festivalDateDeadlineId) => {
	try {
		const query = `SELECT fdd1.id,
			   fdd1.name,	
		       fcf.id AS "festivalCategoryFeeId",
		       fcf.standard_fee AS "standardFee",
		       fcf.gold_fee AS "goldFee"
		FROM festival_date_deadlines AS fdd1
		JOIN (
		    SELECT festival_date_id,
		           date
		    FROM festival_date_deadlines
		    WHERE id = ${festivalDateDeadlineId}
		) AS fdd2 ON fdd1.festival_date_id = fdd2.festival_date_id
		LEFT JOIN festival_category_fees AS fcf ON fcf.festival_date_deadline_id = fdd1.id
		WHERE fdd1.date > fdd2.date order by fdd1.date asc limit 1;`;
		const deadline = await sequelize.query(query, {
			type: QueryTypes.SELECT,
		});
		if (
			deadline.length > 0 &&
			deadline[0].festival_category_fee_id !== null
		) {
			return deadline[0];
		}
		return false;
	} catch (tryErr) {
		return false;
	}
};

const getFestivalCurrentDeadline = async (festivalId) => {
	try {
		const query = `select * from festival_date_deadlines where 
		festival_date_id = (
		  select id from festival_dates 
			where festival_id = $festivalId 
		  and (
		    	now() between opening_date and festival_end 
		    	or
		      opening_date > now()
		  )
		  and is_active = true 
		  limit 1
		)
		and date > now() order by date asc limit 1`;
		const deadline = await sequelize.query(query, {
			type: QueryTypes.SELECT,
			bind: {
				festivalId
			}
		});
		if (
			deadline.length > 0
		) {
			const response = {
				id: deadline[0].id,
				festivalDateId: deadline[0].festival_date_id,
				date: deadline[0].date,
				allCategories: deadline[0].all_categories,
				name: deadline[0].name
			};
			return response;
		}
		return false;
	} catch (tryErr) {
		return false;
	}
};

// Return's latest season, can be running / passed
const getCurrentSession = async (userId = null, festivalId = null) => {
	if (!userId && !festivalId) {
		return;
	}
	let whereType = userId ? "f.user_id" : "f.id";
	const query = `select fd.* from festivals f
        join festival_dates fd on fd.festival_id = f.id
        where ${whereType} = $1
        order by fd.festival_end desc
        limit 1`;
    const currentSession = await sequelize.query(query, {
		type: QueryTypes.SELECT,
		bind: [userId || festivalId]
	});
	return currentSession?.[0];
};

const getDeadlineForForm = async (festivalId) => {
	const query = `select l.*, fdd.id did, fdd.date, fdd.name, fdd.all_categories from (
	  with ff as (
	    select published from festivals where id = $1
	  )
	  select 
	     fd.id, fd.opening_date, fd.notification_date, fd.festival_start, fd.festival_end,     
	     (case when fd.opening_date < now() and ff.published = true then true else false end) disabled
	  from ff, festival_dates fd
	  where festival_id = $1 and is_active = true and (ff.published = false or fd.festival_end > now())
	  order by opening_date desc
	  limit 1
	)  l
	left join festival_date_deadlines fdd on fdd.festival_date_id = l.id
	order by fdd.date asc`;
	const response = await sequelize.query(query, {
		bind: [festivalId],
		type: QueryTypes.SELECT
	});
	const festivalDate = {};
	const deadlines = []; 

	const data = response[0];
	festivalDate.id = festivalId; // Added for fronted support
	festivalDate.festivalDateId = data?.id || null; // Added for fronted support
	festivalDate.openingDate = data?.opening_date || null;
	festivalDate.notificationDate = data?.notification_date || null;
	festivalDate.festivalStart = data?.festival_start || null;
	festivalDate.festivalEnd = data?.festival_end || null;
	festivalDate.disabled = data?.disabled || false;
	for(const dd of response){
		if(dd.date){
			deadlines.push({
				id: dd.did,
				festivalDateId: dd.id,
				name: dd.name,
				date: dd.date,
				allCategories: dd.all_categories,
				disabled: dd.disabled
			});
		}		
	}
	if(!response?.length) {		
		deadlines.push({
			id: null,
			festivalDateId: null,
			name: "Early bird",
			date: null,
			allCategories: true,
			disabled: false
		});
		deadlines.push({
			id: null,
			festivalDateId: null,
			name: "Extended",
			date: null,
			allCategories: true,
			disabled: false
		});
		deadlines.push({
			id: null,
			festivalDateId: null,
			name: "Final",
			date: null,
			allCategories: true,
			disabled: false
		});
	}
	festivalDate.festivalDateDeadlines = deadlines;
	return festivalDate;
};

module.exports = {
	getFestivalCurrentDeadline,
	getDeadlineForForm,
	getCurrentSession,
	getNextDeadline
};