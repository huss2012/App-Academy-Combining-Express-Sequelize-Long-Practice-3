// Instantiate router - DO NOT MODIFY
const express = require('express');
const router = express.Router();

// Import model(s)
const { Classroom, Supply, Student, StudentClassroom, sequelize } = require('../db/models');
const { Op, where } = require('sequelize');

// List of classrooms
router.get('/', async (req, res, next) => {
    let errorResult = { errors: [], count: 0, pageCount: 0 };

    // Phase 6B: Classroom Search Filters
    /*
        name filter:
            If the name query parameter exists, set the name query
                filter to find a similar match to the name query parameter.
            For example, if name query parameter is 'Ms.', then the
                query should match with classrooms whose name includes 'Ms.'

        studentLimit filter:
            If the studentLimit query parameter includes a comma
                And if the studentLimit query parameter is two numbers separated
                    by a comma, set the studentLimit query filter to be between
                    the first number (min) and the second number (max)
                But if the studentLimit query parameter is NOT two integers
                    separated by a comma, or if min is greater than max, add an
                    error message of 'Student Limit should be two integers:
                    min,max' to errorResult.errors
            If the studentLimit query parameter has no commas
                And if the studentLimit query parameter is a single integer, set
                    the studentLimit query parameter to equal the number
                But if the studentLimit query parameter is NOT an integer, add
                    an error message of 'Student Limit should be a integer' to
                    errorResult.errors
    */
    const where = {};

    // Your code here
    /*--------------nameFilter------------------*/
    let { name, studentLimit } = req.query;
    where.name = name !== undefined ? { [Op.like]: `%${name}%` } : { [Op.like]: "%" };
    /*----------studentLimit filter------------*/
    let firstNumber, secondNumber;
    if (studentLimit) {
        firstNumber = studentLimit.split(',')[0];
        secondNumber = studentLimit.split(',')[1]
    }
    where.studentLimit = studentLimit !== undefined ?
        studentLimit.includes(',') ?
            (!isNaN(firstNumber) && !isNaN(secondNumber) && Number(firstNumber) < Number(secondNumber)) ?
                { [Op.between]: [firstNumber, secondNumber] }
                :
                errorResult.errors.push({ message: "Student Limit should be two numbers: min,max" })
            :
            !isNaN(studentLimit) ?
                { [Op.in]: [Number(studentLimit)] }
                :
                errorResult.errors.push({ message: "Student Limit should be an integer" })

        :
        { [Op.not]: null };
    console.log(where);
    console.log(studentLimit);
    console.log(typeof (studentLimit));

    const classrooms = await Classroom.findAll({
        attributes: ['id', 'name', 'studentLimit'],
        where,
        // Phase 1B: Order the Classroom search results
        order: [
            ['name', 'ASC']
        ]
    });

    if (errorResult.errors.length > 0) {
        res.status(400).json(errorResult);
    };

    res.json(classrooms);
});

// Single classroom
router.get('/:id', async (req, res, next) => {
    let classroom = await Classroom.findByPk(req.params.id, {
        attributes: ['id', 'name', 'studentLimit'],
        // include: [
        //     {
        //         model: Supply,
        //     }, {
        //         model: Student
        //     }
        // ],
        // Phase 7:
        // Include classroom supplies and order supplies by category then
        // name (both in ascending order)
        // Include students of the classroom and order students by lastName
        // then firstName (both in ascending order)
        // (Optional): No need to include the StudentClassrooms
        // Your code here
        /*--------------Option 2------------------*/
        //raw: true
    });

    if (!classroom) {
        res.status(404);
        res.send({ message: 'Classroom Not Found' });
    }

    // Phase 5: Supply and Student counts, Overloaded classroom
    // Phase 5A: Find the number of supplies the classroom has and set it as
    // a property of supplyCount on the response

    /*--------------Option 1------------------*/
    const supplyCount = await Supply.count({
        where: {
            classroomId: req.params.id
        }
    });
    const classroomPOJO = classroom.toJSON();
    classroomPOJO.supplyCount = supplyCount;
    /*--------------Option 2------------------*/
    //classroom.supplyCount = supplyCount

    // Phase 5B: Find the number of students in the classroom and set it as
    // a property of studentCount on the response

    const studentCount = await StudentClassroom.count({
        where: {
            classroomId: req.params.id
        }
    });
    classroomPOJO.studentCount = studentCount;

    // Phase 5C: Calculate if the classroom is overloaded by comparing the
    // studentLimit of the classroom to the number of students in the
    // classroom
    classroomPOJO.overloaded = classroomPOJO.studentCount > classroomPOJO.studentLimit ? true : false;
    // Optional Phase 5D: Calculate the average grade of the classroom
    // Your code here
    const classroomAllGrade = await StudentClassroom.findAll({
        where: {
            classroomId: req.params.id
        },
        attributes: {
            include: [[sequelize.fn("AVG", sequelize.col("grade")), 'avgGrade']]
        },
        raw: true
    });
    const averageGrade = classroomAllGrade[0].avgGrade;
    classroomPOJO.avgGrade = averageGrade;

    res.json(classroomPOJO);
});

// Export class - DO NOT MODIFY
module.exports = router;
