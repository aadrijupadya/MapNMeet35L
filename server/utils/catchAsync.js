/* eslint-disable arrow-body-style */
module.exports = fn => { //TODO is this catchAsync function needed?
	return (req, res, next) => {
		fn(req, res, next).catch(err => next(err));
	};	
};


// This function catches all error from aysnc functions