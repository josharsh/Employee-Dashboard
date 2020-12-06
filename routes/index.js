var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', ensureAuthenticated, function (req, res, next) {
	res.render('flow', { title: 'Home' });
});
router.get('/home', ensureAuthenticated, function (req, res, next) {
	res.render('flow', { title: 'Home' });
});
router.get('/about', ensureAuthenticated, function (req, res, next) {
	res.render('about', { title: 'About' });
});
function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect('/users/login');
}

module.exports = router;
