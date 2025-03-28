const swaggerAutogen = require("swagger-autogen")();

const doc = {
    info: {
        title: "API Dokumentasiyası",
        description: "Express.js API üçün avtomatik Swagger dokumentasiyası",
    },
    host: "localhost:3001",
    schemes: ["http"],
};

const outputFile = "./swagger-output.json"; // Çıxış faylı
const endpointsFiles = ["./app.js"]; // Əsas routerlərin olduğu fayl

swaggerAutogen(outputFile,
    endpointsFiles,
    doc);