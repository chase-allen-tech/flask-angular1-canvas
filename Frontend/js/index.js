var app = angular.module("myApp", []);

app.controller("myCtrl", function ($scope, $http) {
    const BASE_URL = "http://127.0.0.1:5000/";

    var is_circle_clicked = false; // Flag for circle figure clicked
    var is_canvas_clicked = false; // Flag for canvas figure clicked
    var circle_e = document.getElementsByClassName('circle-stick')[0];
    var canvas = document.getElementsByClassName("myCanvas")[0];
    var ctx = canvas.getContext("2d"); // Get canvas context
    var symbol_ascii = 65; // Init first Character ascii code
    ctx.translate(0, 0); // Set coordinate of the canvas
    var point_x = 0; // Track current circle coordinate
    var point_y = 0;
    var selected_vector = null;
    var selected_links = null;

    $scope.vector = []; // Vector that contain all node/list objects
    $scope.dragLine = [0, 0, 0, 0]; // Track line coordinates
    $scope.is_move_mode = false;

    // Add a new vector to vector array and save result to server
    const addVector = (header, sym1, sym2, x1, y1, x2, y2) => {
        let item = { 'header': header, 'sym1': sym1, 'sym2': sym2, 'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2 }
        $scope.vector.push(item);
        drawVector();
        saveResult(item);
    }

    // Clear canvas to use and draw starting circle
    const clearRect = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.beginPath();
        ctx.arc(canvas.width - 30, 40, 20, 0, 2 * Math.PI);
        ctx.fillStyle = "blue";
        ctx.fill();
    }

    // From the vector array, draw each node/link
    const drawVector = () => {
        clearRect();

        $scope.vector.forEach(element => { // Draw links
            if (element.header == 'Link') {
                ctx.beginPath();
                ctx.moveTo(element.x1, element.y1);
                ctx.lineTo(element.x2, element.y2);
                ctx.stroke();
            }
        });
        $scope.vector.forEach(element => { // Draw vertex
            if (element.header == "Node") {
                ctx.beginPath();
                ctx.arc(element.x1, element.y1, 20, 0, 2 * Math.PI);
                ctx.fillStyle = "red";
                ctx.fill();

                ctx.beginPath();
                ctx.font = "25px arial";
                ctx.fillStyle = "black";
                ctx.fill();
                ctx.fillText(element.sym1, element.x1 - 10, element.y1 + 10);
            }
        });

        // Draw draging line
        ctx.beginPath();
        ctx.moveTo($scope.dragLine[0], $scope.dragLine[1]);
        ctx.lineTo($scope.dragLine[2], $scope.dragLine[3]);
        ctx.stroke();

    }

    // If enter is clicked in input box
    $scope.onSubmit = (e) => {
        // If enter is clicked
        if (e.keyCode === 13) {
            let inputs = e.target.value.split(' '); // Get values with space separated
            e.target.value = '';

            if (inputs[0].toLowerCase() == 'node' && inputs.length == 1) { // In case of node
                addVector('Node', String.fromCharCode(symbol_ascii++), 'null', parseInt(canvas.width * Math.random()), parseInt(canvas.height * Math.random()), 0, 0);
            } else if(inputs[0].toLowerCase() == 'node' && inputs.length == 2) { // In case of node with node name
                if($scope.vector.filter(vec => vec.sym1 == inputs[1]).length <= 0) {
                    addVector('Node', inputs[1], 'null', parseInt(canvas.width * Math.random()), parseInt(canvas.height * Math.random()), 0, 0);
                } else { alert("There exists same node name"); }
            } else if (inputs[0].toLowerCase() == 'link' && inputs.length == 3) { // In case of link
                let in1 = inputs[1]; //.toUpperCase(); // First vertex
                let in2 = inputs[2]; //.toUpperCase(); // Second vertex
                let vec1 = $scope.vector.filter(vec => vec.sym1 == in1) // First vector with first vertex
                let vec2 = $scope.vector.filter(vec => vec.sym1 == in2) // Second vector with second vertex
                if (inputs[1] != inputs[2] && vec1.length > 0 && vec2.length > 0 && $scope.vector.filter(vec => vec.sym1 == in1 && vec.sym2 == in2).length <= 0) { // If all inputs are valid and there is no duplicate in vector
                    addVector('Link', in1, in2, vec1[0].x1, vec1[0].y1, vec2[0].x1, vec2[0].y1);
                } else { alert("Input values are not valid"); }
            } else { alert("Input value is not Valid"); }
        }
    }

    // Get an object from vector whose vertex is in range of current pointer position (x, y)
    const getVertex = (x, y) => {
        let vec = $scope.vector.filter(vec => vec.header == 'Node' && Math.abs(vec.x1 - x) < 20 && Math.abs(vec.y1 - y) < 20);
        if (vec.length > 0) {
            return vec[0];
        } else {
            return null;
        }

    }

    // Implement mousemove event on canvas
    $scope.onMouseMove = (e) => {
        if (is_circle_clicked) { // If dragging with circle, move that element and update the track position
            circle_e.style.left = e.offsetX - 20 + 'px';
            circle_e.style.top = e.offsetY - 20 + 'px';
            point_x = e.offsetX - 20;
            point_y = e.offsetY - 20;
        } else if (is_canvas_clicked) { // If drag with canvas click, then draw line
            if($scope.is_move_mode) {
                $scope.vector[$scope.vector.indexOf(selected_vector)].x1 = e.offsetX;
                $scope.vector[$scope.vector.indexOf(selected_vector)].y1 = e.offsetY;

                selected_links = $scope.vector.filter(vec => vec.header == 'Link' && (vec.sym1 == selected_vector.sym1 || vec.sym2 == selected_vector.sym1));
                if(selected_links)
                    selected_links.forEach(link => {
                        if(selected_vector.sym1 == link.sym1) {
                            $scope.vector[$scope.vector.indexOf(link)].x1 = e.offsetX;
                            $scope.vector[$scope.vector.indexOf(link)].y1 = e.offsetY;
                        } else {
                            $scope.vector[$scope.vector.indexOf(link)].x2 = e.offsetX;
                            $scope.vector[$scope.vector.indexOf(link)].y2 = e.offsetY;
                        }
                    });
            } else {
                $scope.dragLine[2] = e.offsetX;
                $scope.dragLine[3] = e.offsetY;
            }
            
            drawVector();
        }
    }

    // Implement circle element mouse down event
    $scope.onCircleMouseDown = e => {
        is_circle_clicked = true;
    }

    // implement circle mouse up event
    $scope.onCircleMouseUp = e => {
        if (is_circle_clicked) { // If element was clicked, then init the element position to it's origin and add new vertex
            is_circle_clicked = false;
            circle_e.style.left = null;
            circle_e.style.top = null;
            addVector('Node', String.fromCharCode(symbol_ascii++), 'null', point_x + 20, point_y + 20, 0, 0);
        }
    }

    $scope.onCanvasMouseUp = e => {
        if (is_canvas_clicked) { // Draw line that user is draging on canvas
            is_canvas_clicked = false;
            is_circle_clicked = false;

            let node1 = getVertex($scope.dragLine[0], $scope.dragLine[1]);
            let node2 = getVertex($scope.dragLine[2], $scope.dragLine[3]);

            $scope.dragLine = [0, 0, 0, 0];

            // If both vertex are valid and there is no duplicate in vector, then add the link
            if (node1 && node2 && node1 != node2 && $scope.vector.filter(vec => vec.sym1 == node1.sym1 && vec.sym2 == node2.sym1).length <= 0) {
                addVector('Link', node1.sym1, node2.sym1, node1.x1, node1.y1, node2.x1, node2.y1);
            }
            drawVector();

            if($scope.is_move_mode && selected_vector) {
                updateResult(selected_vector);
                if(selected_links)
                    selected_links.forEach(element => {
                        updateResult(element);
                    });
            }
            selected_vector = null;
            selected_links = null;
        }
    }

    // If mouse is pressed on canvas, then init first point
    $scope.onCanvasMouseDown = e => {
        is_canvas_clicked = true;
        if($scope.is_move_mode) {
            selected_vector = getVertex(e.offsetX, e.offsetY)
        } else {
            $scope.dragLine[0] = e.offsetX;
            $scope.dragLine[1] = e.offsetY;
        }
    }

    // Save the current last vector object to the server
    const saveResult = (data) => {
        $http.post(BASE_URL, { "data": JSON.stringify(data) }, { headers: { 'Content-Type': 'application/json' } }).then(res => {
            console.log(res.data.msg);
        }, err => {
            console.log(err);
        });
    }

    const updateResult = (data) => {
        $http.put(BASE_URL, { "data": JSON.stringify(data) }, { headers: { 'Content-Type': 'application/json' } }).then(res => {
            console.log(res.data.msg);
        }, err => {
            console.log(err);
        });
    }

    // Get all vector data from the server and init variables, and draw on canvas
    const getResults = () => {
        $http.get(BASE_URL, { headers: { 'Content-Type': 'application/json' } }).then(res => {
            let results = JSON.parse(res.data.data);
            $scope.vector = [];
            results.forEach(element => {
                let item = {
                    'header': element[1], 'sym1': element[2], 'sym2': element[3], 'x1': element[4],
                    'y1': element[5], 'x2': element[6], 'y2': element[7]
                }
                $scope.vector.push(item);
            });
            symbol_ascii = Math.max(...results.map(r => { return r[2].charCodeAt(0) }), 64) + 1;
            drawVector();
        }, err => {
            console.log(err);
        });
    }

    // Delete the current clicked vector with sym1 and sym2 identifier
    $scope.onDeleteClicked = (vec) => {
        $http.delete(BASE_URL + vec.sym1 + '/' + vec.sym2).then(res => {
            console.log(res.data.msg);
            getResults();
        }, err => {
            console.log(err);
        });
    }

    // Constructor that init canvas and fetch results from server
    const init = () => {
        clearRect();
        getResults();
    }
    init();
});