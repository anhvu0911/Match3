/*!
 * a match 3 game, practice on using HTML5 canvas 
 * https://github.com/anhvu0911/Match3
 *
 * Author: Nguyen Huu Anh Vu (https://github.com/anhvu0911)
 *
 * Date: 2013-04-09
 */

var TOKEN_SIZE = 50;
var SPACE = 10;
var TOKEN_PER_ROW = 8;
var TOKEN_PER_COL = 8;
var BOARD_WIDTH = (TOKEN_SIZE + SPACE) * TOKEN_PER_ROW - SPACE; //Minus the space of last tokens
var BOARD_HEIGHT = (TOKEN_SIZE + SPACE) * TOKEN_PER_ROW - SPACE; //Minus the space of last tokens
var TOTAL_FRAME = 30;

var NULL_TOKEN = -1;
var RED = 0;
var ORANGE = 1;
var YELLOW = 2;
var GREEN = 3;
var BLUE = 4;
var MAGENTA = 5;
var PURPLE = 6;
var IMAGE_SET = "images/elemental/";
// var IMAGE_SET = "images/browsers/";

var requestAnimationFrame;
var gameCanvas;
var context;
var board = [];

function Cell(col, row){
	this.col = col;
	this.row = row;
}

//========================================================
// 7 TYPES OF TOKEN
//========================================================
function Token(col, row){
	this.row = row;
	this.col = col;
	this.type = NULL_TOKEN;
	this.selected = false;
	this.img = new Image();
	this.calculateXY = function(){
		this.x = this.col*(TOKEN_SIZE + SPACE);
		this.y = this.row*(TOKEN_SIZE + SPACE);
	}
	this.isOnTheSameCellWith = function(token){
		return (this.row == token.row) && (this.col == token.col);
	}
	this.isAdjacentTo = function(token){
		return (((Math.abs(this.row - token.row) == 1) && (this.col == token.col)) // same column
			|| ((Math.abs(this.col - token.col) == 1) && (this.row == token.row))) // same row;
	}
	this.draw = function(){
		if(this.selected){
			context.strokeRect(this.x+SPACE/2, this.y+SPACE/2, TOKEN_SIZE, TOKEN_SIZE);
		}
		context.drawImage(this.img, this.x+SPACE, this.y+SPACE, TOKEN_SIZE-SPACE, TOKEN_SIZE-SPACE);
		
		
		// context.fillRect(this.x+SPACE, this.y+SPACE, TOKEN_SIZE-SPACE, TOKEN_SIZE-SPACE);
		
		//Debugging info
		// context.fillStyle = "black";
		// context.font = "15pt Aria";
		// context.fillText(this.row + "," + this.col, this.x + 10, this.y+20);
	}
	this.toString = function(){
		return "[" + this.type + "]" + this.row + "-" + this.col + "(" + this.x + "," + this.y + ")";
	}
	this.swapWith = function (token) {
		var thisRow = this.row;
		var thisCol = this.col;
		var tokenRow = token.row;
		var tokenCol = token.col;
	   
		var temp = board[tokenCol][tokenRow];
		board[tokenCol][tokenRow] = board[thisCol][thisRow];
		board[thisCol][thisRow] = temp;
	   
		var tempRow = board[tokenCol][tokenRow].row;
		board[tokenCol][tokenRow].row = board[thisCol][thisRow].row;
		board[thisCol][thisRow].row = tempRow;
	   
		var tempCol = board[tokenCol][tokenRow].col;
		board[tokenCol][tokenRow].col = board[thisCol][thisRow].col;
		board[thisCol][thisRow].col = tempCol;
		
		this.calculateXY();
		token.calculateXY();
	}
	
	this.calculateXY();
}

function Red(col, row){
	Token.call(this, col, row);
	this.type = RED;
	this.img.src = IMAGE_SET + "red.png";
	this.draw = function(){
		//context.fillStyle = "red";
		Red.prototype.draw.call(this);
	}
}
Red.prototype = new Token();
Red.prototype.constructor = Red;

function Orange(col, row){
	Token.call(this, col, row);
	this.type = ORANGE;
	this.img.src = IMAGE_SET + "orange.png";
	this.draw = function(){
		//context.fillStyle = "orange";
		Orange.prototype.draw.call(this);
	}
}
Orange.prototype = new Token();
Orange.prototype.constructor = Orange;

function Yellow(col, row){
	Token.call(this, col, row);
	this.type = YELLOW;
	this.img.src = IMAGE_SET + "yellow.png";
	this.draw = function(){
		//context.fillStyle = "yellow";
		Yellow.prototype.draw.call(this);
	}
}
Yellow.prototype = new Token();
Yellow.prototype.constructor = Yellow;

function Green(col, row){
	Token.call(this, col, row);
	this.type = GREEN;
	this.img.src = IMAGE_SET + "green.png";
	this.draw = function(){
		//context.fillStyle = "green";
		Green.prototype.draw.call(this);
	}
}
Green.prototype = new Token();
Green.prototype.constructor = Green;

function Blue(col, row){
	Token.call(this, col, row);
	this.type = BLUE;
	this.img.src = IMAGE_SET + "blue.png";
	this.draw = function(){
		//context.fillStyle = "blue";
		Blue.prototype.draw.call(this);
	}
}
Blue.prototype = new Token();
Blue.prototype.constructor = Blue;

function Magenta(col, row){
	Token.call(this, col, row);
	this.type = MAGENTA;
	this.img.src = IMAGE_SET + "magenta.png";
	this.draw = function(){
		//context.fillStyle = "magenta";
		Magenta.prototype.draw.call(this);
	}
}
Magenta.prototype = new Token();
Magenta.prototype.constructor = Magenta;

function Purple(col, row){
	Token.call(this, col, row);
	this.type = PURPLE;
	this.img.src = IMAGE_SET + "purple.png";
	this.draw = function(){
		//context.fillStyle = "purple";
		Purple.prototype.draw.call(this);
	}
}
Purple.prototype = new Token();
Purple.prototype.constructor = Purple;

// =============================================
// OVERRIDE METHOD
// =============================================

// Return a list of common elements from two arrays
Array.prototype.intersect = function(array){
	var newArray = [];
	for(var i = 0; i < this.length; i++){
		newArray.push(this[i]);
	}
	for(var i = 0; i < array.length; i++){
		if(newArray.indexOf(array[i]) > 0){
			newArray.push(array[i]);
		}
	}
	return newArray;
}

// If it intersect, return true!
Array.prototype.hasCommonElement = function(array){
	for(var i = 0; i < array.length; i++){
		if(this.indexOf(array[i]) >= 0){
			return true;
		}
	}
	return false;
}

// concat, but allow no duplicate
Array.prototype.merge = function(array){
	for(var i = 0; i < array.length; i++){
		if(this.indexOf(array[i]) < 0){
			this.push(array[i]);
		}
	}
	return this;
}

// add + sort token, value row from low to high
Array.prototype.addToken = function(token){
	var i = 0;
	for(;i < this.length;i++){
		if(token.row < this[i].row){
			break;
		}
	}
	this.splice(i,0,token);
	
	return this;
}

//========================================================
// MAIN METHODS
//========================================================
function main(){
	gameCanvas = document.getElementById("gameCanvas");
	context = gameCanvas.getContext("2d");

	requestAnimationFrame = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        function(callback) {
          return setTimeout(callback, 1);
        };
		
	// Initialize the board, randomize tokens
	// Generate by board[col][row] -> better dropdown management
	for(var i = 0; i < TOKEN_PER_COL; i++){
		board[i] = [];
		for(var j = 0; j < TOKEN_PER_ROW; j++){
			board[i][j] = createToken(i, j);
		}
	}
	
	toggleClickEvent(true);
	
	// TODO: Include dragging event
	gameCanvas.addEventListener("mousemove", onMouseMove, false);
	
	gameCanvas.addEventListener("keydown", hint, false);
	
	checkMatches();
	draw();
}

// register mouse event
function toggleClickEvent(on){
	if(on){
		gameCanvas.addEventListener("click", selectToken, false);
	}else{
		gameCanvas.removeEventListener("click", selectToken, false);
	}
}

// Factory method, create random Token for col, row
function createToken(col, row){
	switch(parseInt(Math.random()*7)){
		case RED:	 return new Red(col, row);
		case ORANGE: return new Orange(col, row);
		case YELLOW: return new Yellow(col, row);
		case GREEN:	 return new Green(col, row);
		case BLUE:	 return new Blue(col, row);
		case MAGENTA:return new Magenta(col, row);
		case PURPLE: return new Purple(col, row);
		default: return new Token(col, row);
	}
}

// Draw the board, tokens
function draw(){
	// Don't use context.clearRect(0, 0, gameCanvas.width, gameCanvas.height); // Performance hack
	gameCanvas.width = gameCanvas.width;
	
	context.shadowOffsetX = 0;
	context.shadowOffsetY = 0;
	context.shadowColor = "gray";
	
	// drawing the gridline
	context.strokeStyle = "lightgray";
	for(var i = 0; i < TOKEN_PER_COL; i++){
		for(var j = 0; j < TOKEN_PER_ROW; j++){
			context.strokeRect(board[i][j].col*(TOKEN_SIZE + SPACE), 
							   board[i][j].row*(TOKEN_SIZE + SPACE), TOKEN_SIZE+SPACE, TOKEN_SIZE+SPACE);
		}
	}
	context.strokeStyle = "black";
	
	// Don't use context.shadowBlur // greatly degrade performance	
	// context.shadowOffsetX = 3;
	context.shadowOffsetY = 6;
	
	// draw each Token
	for(var i = 0; i < TOKEN_PER_COL; i++){
		context.shadowOffsetX = 2*(i-3.5);
		for(var j = 0; j < TOKEN_PER_ROW; j++){
			// context.shadowOffsetY = 3*(j-3.5);
			board[i][j].draw();	
		}
	}
	
	requestAnimationFrame(draw);
}

// Return the row and col of the selected token.
// To be used by selectToken(), onMouseMove()
// e: mouseEvent
function getCell(e){

	// Offset from document body
	var x = -gameCanvas.offsetLeft;
	var y = -gameCanvas.offsetTop;
	
	// Offset by page scroll
	if(e.pageX != undefined	&& e.pageY != undefined){
		x += e.pageX;
		y += e.pageY;
	}else{
		x += e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
		y += e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
	}
	
	return new Cell(Math.floor(x / (TOKEN_SIZE+SPACE)), Math.floor(y / (TOKEN_SIZE+SPACE)));		
}

// Find the selected Token
var isSelectingFirst = true;
var firstSelectedToken = null;
var lastSelectedToken = null;
function selectToken(e){
	var selectedCell = getCell(e);
	
	if (isSelectingFirst) {
		firstSelectedToken = board[selectedCell.col][selectedCell.row];
		firstSelectedToken.selected = true;
	} else {
		lastSelectedToken = board[selectedCell.col][selectedCell.row];

		// If the same token => Deselect
		if (firstSelectedToken.isOnTheSameCellWith(lastSelectedToken)) {
			firstSelectedToken.selected = false;
			
		// If they are next to each other, swap
		} else if (lastSelectedToken.isAdjacentTo(firstSelectedToken)) {
			firstSelectedToken.selected = false;
			swap(firstSelectedToken, lastSelectedToken);
			firstSelectedToken = null;
		
		// If they are far away, re-select the first token
		} else {
			// Deselect first token
			firstSelectedToken.selected = false;
			
			// set the first token as the newly selected
			firstSelectedToken = board[selectedCell.col][selectedCell.row];
			firstSelectedToken.selected = true;
			isSelectingFirst = !isSelectingFirst;
		}
	}
	isSelectingFirst = !isSelectingFirst;
}

// TODO: Find the selected Token by dragging
var firstDraggedToken = null;
var lastDraggedToken = null;
function onMouseMove(e){
	var hoverCell = getCell(e);
	
	// Drag
	if(e.buttons){
		/*if(firstDraggedToken == null || !firstDraggedToken.isOnTheSameCellWith(hoverCell)){	
			if (isSelectingFirst) {
				firstDraggedToken = board[hoverCell.col][hoverCell.row];
				firstDraggedToken.selected = true;
			} else {
				firstDraggedToken.selected = false;
				lastDraggedToken = board[hoverCell.col][hoverCell.row];
				
				if (lastDraggedToken.isAdjacentTo(firstDraggedToken)) {
					swap(firstDraggedToken, lastDraggedToken);
					firstDraggedToken = null;
					// Find a way to force mouseup
				} else {
					firstDraggedToken = board[hoverCell.col][hoverCell.row];
					firstDraggedToken.selected = true;
					isSelectingFirst = !isSelectingFirst;
				}
			}
			isSelectingFirst = !isSelectingFirst;
		}*/
	
	// Hover
	} else{
		//board[hoverCell.col][hoverCell.row].selected=true;
	}
	
	
}

// Swap token a and b
// swapBack: a boolean - if after swap, no match found, swap back
function swap(a, b, swapBack){
	toggleClickEvent(false);
	
	var frame = 0;
	var deltaX = (b.x - a.x) / TOTAL_FRAME;
	var deltaY = (b.y - a.y) / TOTAL_FRAME;
	
	(function moveSwappedToken(){
		a.x += deltaX;
		a.y += deltaY;
		
		b.x -= deltaX;
		b.y -= deltaY;
	
		frame++;
		if(frame == TOTAL_FRAME){
			toggleClickEvent(true);
			a.swapWith(b);
			if(!swapBack){
				checkMatches(function(){
					swap(a,b, true);
				}); // No match found, swap again
			}
		}else{
			requestAnimationFrame(moveSwappedToken);
		}
	})();
}

// Find the list of matches, auto-call explode
function checkMatches(callback){
	var matchLists = findMatches();
		
	// Found some matches, explode them!
	if(matchLists.length > 0){
		explode(matchLists);
	} else {
		if (typeof(callback) == 'function') callback();
	}
}

// TODO: Optimization, some token does not need to search again
// Search the matching pair, using trace algorithm
function findMatches(){	
	var matchLists = [];
	var current = null;
	for(var i = 0; i < TOKEN_PER_COL; i++){
		for(var j = 0; j < TOKEN_PER_ROW; j++){
			current = board[i][j];
			traceAndAddToMatchList([current], current, 0, 1, false); // down
			traceAndAddToMatchList([current], current, 1, 0, false); // right
		}
	}
	
	// TODO: Merge this with traceAndAddToMatchList, filter while tracing, OR MAY BE NOT, use for explosion 5- L turn tokens
	// Merge match lists that have the same tokens
	for(i = 0; i < matchLists.length - 1; i++){
		for(j = i+1; j < matchLists.length; j++){
			if(matchLists[i].hasCommonElement(matchLists[j])){
				matchLists[i].merge(matchLists[j]);
				matchLists.splice(j,1);
				break;
			}	
		}
	}
	
	/*console.log("================Check Match===================");
	for(i = 0; i < matchLists.length; i++){
		for(j = 0; j < matchLists[i].length; j++){
			console.log(matchLists[i][j]);		
		}				
		console.log("-----");
	}*/

	// Starting on a token, trace similar tokens
	// matchLists: a list of all matches
	// tempMatchLists: temporary list to construct match
	// token,rowIndent,colIndent: next token position from current token
	// added: Has this tempMatchLists been added to matchLists?
	function traceAndAddToMatchList(tempMatchLists, token, rowIndent, colIndent, added){

		// prevent out of bound
		if(board[token.col + colIndent] == undefined) return;
		
		var nextToken = board[token.col + colIndent][token.row + rowIndent];
		var inMatchlist;
		
		// Found a match
		if(nextToken != undefined && nextToken.type == token.type){
		
			// Check if that match exist, if yes, no need to create new matchlist
			inMatchlist = false;
			for(var i = 0; i < matchLists.length; i++){
				// Include token and nextToke check to allow a list of >3 tokens
				if(matchLists[i].indexOf(token) > 0 && matchLists[i].indexOf(nextToken) > 0){
					inMatchlist = true;
				}
			}
			
			// If not, add to the match list
			if(!inMatchlist){
				tempMatchLists.push(nextToken);
				if(tempMatchLists.length > 2 && !added) {
					matchLists.push(tempMatchLists);
					added = true;
				}
				
				traceAndAddToMatchList(tempMatchLists, nextToken, rowIndent, colIndent, added);
			}
		}
	}
	
	return matchLists;
}

// TODO: Animation Explosion effect
function explode(matchLists){
	console.log("explode");
	
	dropDown(matchLists);
}

// TODO: Make animation of dropping
// Temp: Replace with above appropriate tokens
function dropDown(matchLists){
	// Merge all matches into An array of array
	// each is a token with same column, sort row from low to high
	var matches = [];
	for(var i = 0; i < matchLists.length; i++){		
		for(var j = 0; j < matchLists[i].length; j++){
			var token = matchLists[i][j];
			
			if(matches[token.col] == undefined){
				matches[token.col] = [];
			}
			
			matches[token.col].addToken(token);
		}
	}
	
	// Start shift board[column] based on matches
	for(var i = 0; i < matches.length; i++){
		if(matches[i] == undefined) continue;
		
		var currentRow = TOKEN_PER_ROW - 1;
		var currentMatchIndex = matches[i].length - 1;
		var currentBlankRow = matches[i][currentMatchIndex].row;
		var token = null;
		
		while (currentBlankRow >= 0){
			// Found a match, this item will be removed
			if (currentMatchIndex >= 0 && currentRow == matches[i][currentMatchIndex].row){
				currentMatchIndex--;
				
			// Else, drop the above tokens to fill the blank
			}else if (currentRow < currentBlankRow && currentRow >= 0){				
				token = board[i][currentRow];
				moveToken(token, token.x, token.y, token.x, token.y + (currentBlankRow - currentRow)*(TOKEN_SIZE + SPACE));
				
				board[i][currentBlankRow] = token;
				token.row = currentBlankRow;
		
				currentBlankRow--;
			}
			
			// Move all stock tokens? fill columns with new tokens
			if (currentRow < 0){				
				token = createToken(i, currentBlankRow);
				moveToken(token, token.x, token.y - matches[i].length*(TOKEN_SIZE + SPACE), token.x, token.y);
				board[i][currentBlankRow] = token;
				currentBlankRow--;
			}
			
			currentRow--;
		}
	}
	
	waitForAnimationFinish(TOTAL_FRAME*1.5, checkMatches);
}

function waitForAnimationFinish(frame, callback){
	toggleClickEvent(false);
	var f = 0;
	
	(function wait(){
		f++;
		if (f < frame){
			requestAnimationFrame(wait);
		} else {
			toggleClickEvent(true);
			if (typeof(callback) == 'function'){
				callback();
			}
		}
	})();
}

// Move a token from start to end position
function moveToken(token, startX, startY, endX, endY, callback){
	var frame = 0;
	var deltaX = (endX - startX) / TOTAL_FRAME;
	var deltaY = (endY - startY) / TOTAL_FRAME;
	token.x = startX;
	token.y = startY;
	
	(function move(){
				   
		// Change it into new position  
		token.x += deltaX;
		token.y += deltaY;
	
		frame++;
		if (frame < TOTAL_FRAME){
			requestAnimationFrame(move);
		} else {
			token.x = endX;
			token.y = endY;
			
			if (typeof(callback) == 'function'){
				callback();
			}
		}
	})();
}

// Find all possible matches
function hint(e){
	var hintList = getHintList();
	
	if (hintList.length == 0){
		scamble(checkMatches);
	}
	
	console.log("================Check Hint===================");
	for(var i = 0; i < hintList.length; i++){
		for(var j = 0; j<hintList[i].length; j++){
			hintList[i][j].selected = true;
			console.log(hintList[i][j]);
		}
		console.log("---");
	}
}

// TODO: remove duplicate in hintList
// Find all possible matches [[pair1, pair1], [pair2, pair2]...]
function getHintList(){
	var hintList = [];

	var current = null;
	for(var i = 0; i < TOKEN_PER_COL; i++){
		for(var j = 0; j < TOKEN_PER_ROW; j++){
			current = board[i][j];
			traceAndAddToPotentialList([current], current, 1, 0, current.type); // down
			traceAndAddToPotentialList([current], current, 0, 1, current.type); // right
		}
	}
	
	function traceAndAddToPotentialList(tempMatchLists, token, rowIndent, colIndent, type){

		var nextToken = undefined;
		var inPotentialList;
		
		// Is next token out of bound?
		if(board[token.col + colIndent] != undefined){
			nextToken = board[token.col + colIndent][token.row + rowIndent];
		}

		if (nextToken != undefined){
			// Found a match
			if(nextToken.type == type){
			
				// Add to match lists and continue
				tempMatchLists.push(nextToken);
				traceAndAddToPotentialList(tempMatchLists, nextToken, rowIndent, colIndent, token.type);
				
			// Found a two pair (o o), add token at the head (x o o) and tail (o o x) to potential list
			}else if (tempMatchLists.length > 1){
			
				// tail (o o x)
				evaluateNeighbors(nextToken, rowIndent == 0, true, colIndent == 0, true);
				
				// head (x o o)
				if(rowIndent == 1){
					evaluateNeighbors(board[nextToken.col][nextToken.row-3], true, rowIndent == 0, true, colIndent == 0);
				} else if (colIndent == 1){
					if(board[nextToken.col-3] != undefined){
						evaluateNeighbors(board[nextToken.col-3][nextToken.row], true, rowIndent == 0, true, colIndent == 0);
					}
				}
				
			// Search for middle potential token (o x o)
			} else if (tempMatchLists.length == 1){
				if(board[nextToken.col + colIndent] == undefined) return;
		
				var nextnextToken = board[nextToken.col + colIndent][nextToken.row + rowIndent];
				if(nextnextToken != undefined && nextnextToken.type == type){
					evaluateNeighbors(nextToken, colIndent == 1, colIndent == 1, rowIndent == 1, rowIndent == 1);
				}
			}
		
		// In case, the tail (o o |x) is out-of-bound, search the head (x o o)
		} else if (tempMatchLists.length > 1){
			if(rowIndent == 1){
				evaluateNeighbors(board[token.col][token.row-2], true, rowIndent == 0, true, colIndent == 0);	
			} else if (colIndent == 1){
				if(board[token.col-2] != undefined){
					evaluateNeighbors(board[token.col-2][token.row], true, rowIndent == 0, true, colIndent == 0);	
				}
			}		
		}
		
		// Search in 4 directions
		function evaluateNeighbors(hintToken, searchUp, searchDown, searchLeft, searchRight){
			if(hintToken == undefined) return;
			
			if(searchUp && board[hintToken.col][hintToken.row-1] != undefined){
				addTokenToHintList(board[hintToken.col][hintToken.row-1], hintToken);
			}
			
			if(searchDown && board[hintToken.col][hintToken.row+1] != undefined){
				addTokenToHintList(board[hintToken.col][hintToken.row+1], hintToken);
			}
			
			if(searchLeft && board[hintToken.col-1] != undefined){
				addTokenToHintList(board[hintToken.col-1][hintToken.row], hintToken);
			}
			
			if(searchRight && board[hintToken.col+1] != undefined){
				addTokenToHintList(board[hintToken.col+1][hintToken.row], hintToken);
			}
		}
		
		function addTokenToHintList(hintToken, tokenToSwap){
			if (hintToken.type == type){
				hintList.push([tokenToSwap, hintToken]);
			}
		}
	}
	
	return hintList;
}

// Rearrange the board
function scamble(callback){
	console.log("No Match found SCRAMBLEEEEEEEEEEEEEEEEEEEEEE");
	
	//if (typeof(callback) == 'function') callback();
}