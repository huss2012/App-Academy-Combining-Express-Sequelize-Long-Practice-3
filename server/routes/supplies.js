// Instantiate router - DO NOT MODIFY
const express = require('express');
const router = express.Router();

// Import model(s)
const { Supply, Classroom, sequelize, StudentClassroom, Student } = require('../db/models');
const { where } = require('sequelize');

// List of supplies by category
router.get('/category/:categoryName', async (req, res, next) => {
    // Phase 1C:
    // Find all supplies by category name
    // Order results by supply's name then handed
    // Return the found supplies as the response body
    const supplies = await Supply.findAll({
        include: [
            {
                model: Classroom,
                //through: { attributes: [] },
                attributes: ['id', 'name'],
            }
        ],
        where: {
            category: req.params.categoryName
        },
        order: [
            [Classroom, 'name', 'ASC'],
            ['name', 'ASC'],
            ['handed', 'ASC']
        ]
    });
    res.json(supplies);
    // Phase 8A:
    // Include Classroom in the supplies query results
    // Order nested classroom results by name first then by supply name
    // Your code here
});


// Scissors Supply Calculation - Business Logic Goes Here!
router.get('/scissors/calculate', async (req, res, next) => {
    let result = {};

    // Phase 10A: Current number of scissors in all classrooms
    // result.numRightyScissors should equal the total number of all
    // right-handed "Safety Scissors" currently in all classrooms
    // result.numLeftyScissors should equal the total number of all
    // left-handed "Safety Scissors" currently in all classrooms
    // result.totalNumScissors should equal the total number of all
    // "Safety Scissors" currently in all classrooms, regardless of
    // handed-ness
    // Your code here
    const aggregatedData = await Supply.findAll({
        where: {
            name: 'Safety Scissors',
        },
        attributes: [
            [sequelize.fn("SUM", sequelize.literal(`CASE WHEN handed = 'right' THEN 1 ELSE 0 END`)), "rightHand"],
            [sequelize.fn("SUM", sequelize.literal(`CASE WHEN handed = 'left' THEN 1 ELSE 0 END`)), 'leftHand'],
            [sequelize.fn("COUNT", sequelize.col('id')), 'total'],
        ],

        raw: true

    });
    result.numRightyScissors = aggregatedData[0].rightHand;
    result.numLeftyScissors = aggregatedData[0].leftHand;
    result.totalNumScissors = aggregatedData[0].total
    // Phase 10B: Total number of right-handed and left-handed students in all
    // classrooms
    // result.numRightHandedStudents should equal the total number of
    // right-handed students in all classrooms
    // Note: This is different from the total amount of students that
    // are right-handed in the database. This is a total of all
    // right-handed students in each classroom combined. Some
    // students are enrolled in multiple classrooms, so if a
    // right-handed student was enrolled in 3 classrooms, that
    // student would contribute to 3 students in the total amount of
    // right-handed students in all classrooms.
    // result.numLeftHandedStudents should equal the total number of
    // left-handed students in all classrooms
    // Your code here
    const aggregatedStudentsData = await Classroom.findAll({
        attributes: {
            include: [
                [
                    sequelize.fn(
                        "SUM",
                        sequelize.literal(`CASE WHEN "Students"."leftHanded" = true THEN 1 ELSE 0 END`)
                    ),
                    "leftHandedTotalStudents"
                ],
                [
                    sequelize.fn(
                        "SUM",
                        sequelize.literal(`
                        CASE WHEN "Students"."leftHanded" = false THEN 1 ELSE 0 END
                        `)
                    ),
                    "rightHandedTotalStudents"
                ]
            ]
        },
        include: {
            model: Student,
            through: { attributes: [] },
            attributes: []
        },
        raw: true
    });
    result.numRightHandedStudents = aggregatedStudentsData[0].rightHandedTotalStudents;
    result.numLeftHandedStudents = aggregatedStudentsData[0].leftHandedTotalStudents
    // Phase 10C: Total number of scissors still needed for all classrooms
    // result.numRightyScissorsStillNeeded should equal the total number
    // of right-handed scissors still needed to be added to all the
    // classrooms
    // Note: This is the number of all right-handed students in all
    // classrooms subtracted by the number of right-handed scissors
    // that all the classrooms already have.
    // result.numLeftyScissorsStillNeeded should equal the total number
    // of left-handed scissors still needed to be added to all the
    // classrooms
    // Your code here
    const Phase10C = await Classroom.findAll({
        // where: {
        //     name: "Safety Scissors"
        // },
        include: [
            //{ model: Student },
            {
                model: Supply,
                where: {
                    name: 'Safety Scissors'
                },
                //through: {attributes: []}
            }
        ],
        attributes: {
            include: [
                [
                    sequelize.fn(
                        "SUM",
                        sequelize.literal(
                            `CASE WHEN "Supplies"."handed" = "right" THEN 1 ELSE 0 END`
                        )
                    ),
                    "currentRightSicssorsNumber"
                ],
                [
                    sequelize.fn(
                        "SUM",
                        sequelize.literal(`CASE WHEN "Supplies"."handed" = "left" THEN 1 ELSE 0 END`)
                    ),
                    "currentLeftSicssorsNumber"
                ]
            ]
        },
        raw: true
    });
    //result.Phase10C = Phase10C;
    result.numRightyScissorsStillNeeded = result.numRightHandedStudents - Phase10C[0].currentRightSicssorsNumber;
    result.numLeftyScissorsStillNeeded = result.numLeftHandedStudents - Phase10C[0].currentLeftSicssorsNumber;
    res.json(result);
});

// Export class - DO NOT MODIFY
module.exports = router;
