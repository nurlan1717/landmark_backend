const express = require('express');
const fs = require("fs");
const carsData = JSON.parse(fs.readFileSync(__dirname + '/../data/data.json'))


exports.testId = (req, res, next, val) => {

    if( isNaN(Number(val))){
        return res.status(403).json({message : 'Param is not number, try again.'});
    }

    if (val * 1 >  carsData.length) {
        return res.status(403).json({message : 'Not Found'});
    }
    next();
}
