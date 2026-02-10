const express = require('express');
const router = express.Router();

const addCourse = require('./addCourse');          // POST /
const getAllCourses = require('./getAllCourses');  // GET /
const getCourseById = require('./getCourseById');  // GET /:id
const updateCourse = require('./updatecourse');    // PUT /:id
const deleteCourse = require('./deleteCourse');    // DELETE /:id

// Important: register specific routes AFTER generic ones
router.use('/', addCourse);
router.use('/', getAllCourses);
router.use('/', updateCourse);
router.use('/', deleteCourse);
router.use('/', getCourseById); // 👈 moved last

module.exports = router;
