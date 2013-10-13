/*
 * a match 3 game, practice on using HTML5 canvas 
 * https://github.com/anhvu0911/Match3
 *
 * Author: Nguyen Huu Anh Vu (https://github.com/anhvu0911)
 *
 * Date: 2013-04-09
 */

//========================================================
// MAIN METHODS
//========================================================
function main(){
	gameCanvas = document.getElementById("gameCanvas");
	context = gameCanvas.getContext("2d");
	
	slashImg = document.getElementById("slash");
	shineImg = document.getElementById("shine");
	sunImg = document.getElementById("sun");
	
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
			board[i][j] = new Token(i, j);
			board[i][j].setType(Math.round(Math.random()*NUMBER_OF_TOKEN_TYPE));
		}
	}
	
	// Draw ONCE, fill the board, loop two times because changing canvas state in loop costs performance	
	gridCanvas = document.getElementById("gridCanvas");
	gridContext = gridCanvas.getContext("2d");
	
	gridContext.fillStyle = "#222";
	board.forEach(function(boardCol, i){
		boardCol.forEach(function (token, j){
			if((i+j) % 2 != 0){
				gridContext.fillRect(token.col*CELL_SIZE, token.row*CELL_SIZE, CELL_SIZE, CELL_SIZE);
			}
		});
	});
	
	gridContext.fillStyle = "#111";
	board.forEach(function(boardCol, i){
		boardCol.forEach(function (token, j){
			if((i+j) % 2 == 0){
				gridContext.fillRect(token.col*CELL_SIZE, token.row*CELL_SIZE, CELL_SIZE, CELL_SIZE);
			}
		});
	});
	
	toggleClickEvent(true);
	toggleMouseMoveEvent(true);
	gameCanvas.addEventListener("keydown", hint, false);
	
	checkMatches();
	draw();
	
	// board[3][3].setType(SPECIAL);
	// board[2][2].special = new MoonToken();
	board[3][3].special = new SunToken();
	// board[3][4].special = new SunToken();
	board[3][4].special = new MoonToken();
}

// register mouse event
function toggleClickEvent(on){
	if(on){
		gameCanvas.addEventListener("click", selectToken, false);
	}else{
		gameCanvas.removeEventListener("click", selectToken, false);
	}
}

function toggleMouseMoveEvent(on){
	if(on){
		gameCanvas.addEventListener("mousemove", onMouseMove, false);
	}else{
		gameCanvas.removeEventListener("mousemove", onMouseMove, false);
		gameCanvas.removeEventListener("click", selectToken, false);
	}
}

// TODO: Optimize, get token from pool, create = garbage collector
// Factory method, create random Token for col, row
function createToken(col, row){
	switch(parseInt(Math.random()*NUMBER_OF_TOKEN_TYPE)){
		case RED:	 return new Token(col, row, RED, "red.png");break;
		case ORANGE: return new Token(col, row, ORANGE,"orange.png");break;
		case YELLOW: return new Token(col, row, YELLOW,"yellow.png");break;
		case GREEN:	 return new Token(col, row, GREEN,"green.png");break;
		case BLUE:	 return new Token(col, row, BLUE,"blue.png");break;
		case MAGENTA:return new Token(col, row, MAGENTA,"magenta.png");break;
		case PURPLE:return new Token(col, row, PURPLE,"purple.png");break;
		default: return new Token(col, row);
	}
}

// Draw the board, tokens
function draw(){
	// Don't use context.clearRect(0, 0, gameCanvas.width, gameCanvas.height); // Performance hack
	gameCanvas.width = gameCanvas.width;
	
	// draw each Token
	board.forEach(function(boardCol, i){
		boardCol.forEach(function (token, j){
			if (token.special){
				token.special.draw(token);
			}
			token.draw();
		});
	});
	
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
	
	// Out of bound?
	if(selectedCell.col >= TOKEN_PER_COL || selectedCell.row >= TOKEN_PER_ROW){
		return;
	}
	
	if (isSelectingFirst) {
		firstSelectedToken = board[selectedCell.col][selectedCell.row];
		firstSelectedToken.setState(SELECT_STATE);
	} else {
		lastSelectedToken = board[selectedCell.col][selectedCell.row];

		// If the same token => Deselect
		if (firstSelectedToken.isOnTheSameCellWith(lastSelectedToken)) {
			firstSelectedToken.setState();
			
		// If they are next to each other, swap
		} else if (lastSelectedToken.isAdjacentTo(firstSelectedToken)) {
			firstSelectedToken.setState();
			swap(firstSelectedToken, lastSelectedToken);
		
		// If they are far away, re-select the first token
		} else {
			// Deselect first token
			firstSelectedToken.setState();
			
			// set the first token as the newly selected
			firstSelectedToken = board[selectedCell.col][selectedCell.row];
			firstSelectedToken.setState(SELECT_STATE);
			isSelectingFirst = !isSelectingFirst;
		}
	}
	isSelectingFirst = !isSelectingFirst;
}

// TODO: Find the selected Token by dragging
var firstDraggedToken = null;
var lastDraggedToken = null;
var oldHoverCell = new Cell(0,0);
function onMouseMove(e){
	var hoverCell = getCell(e);
	
	// Drag
	if(e.buttons){
		/*if(firstDraggedToken == null || !firstDraggedToken.isOnTheSameCellWith(hoverCell)){	
			if (isSelectingFirst) {
				firstDraggedToken = board[hoverCell.col][hoverCell.row];
				firstDraggedToken.setState(SELECT_STATE);
			} else {
				firstDraggedToken.setState();
				lastDraggedToken = board[hoverCell.col][hoverCell.row];
				
				if (lastDraggedToken.isAdjacentTo(firstDraggedToken)) {
					swap(firstDraggedToken, lastDraggedToken);
					firstDraggedToken = null;
					// Find a way to force mouseup
				} else {
					firstDraggedToken = board[hoverCell.col][hoverCell.row];
					firstDraggedToken.setState(SELECT_STATE);
					isSelectingFirst = !isSelectingFirst;
				}
			}
			isSelectingFirst = !isSelectingFirst;
		}*/
	
	// Hover
	} else{
		if(oldHoverCell.row != hoverCell.row || oldHoverCell.col != hoverCell.col){
			if(hoverCell.col < TOKEN_PER_COL && hoverCell.row < TOKEN_PER_ROW){
					if(board[oldHoverCell.col][oldHoverCell.row].state != SELECT_STATE){
						board[oldHoverCell.col][oldHoverCell.row].setState(NORMAL_STATE);
					}
					oldHoverCell = hoverCell;
					board[hoverCell.col][hoverCell.row].setState(HOVER_STATE);
			} else {
				if(board[oldHoverCell.col][oldHoverCell.row].state != SELECT_STATE){
					board[oldHoverCell.col][oldHoverCell.row].setState(NORMAL_STATE);
				}
			}
		}
	}
}

// Swap token a and b
// swapBack: a boolean - if after swap, no match found, swap back
function swap(a, b, swapBack){
	
	toggleClickEvent(false);
	toggleMouseMoveEvent(false);

	// If one is special token, destroy all tokens of the same type as the other
	if(a.type == SPECIAL){
		a.special.explode([a], a, null, b.type);
	}else if (b.type == SPECIAL){
		b.special.explode([b], b, null, a.type);
	}else{
		board[oldHoverCell.col][oldHoverCell.row].setState(NORMAL_STATE);
		
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
				toggleMouseMoveEvent(true);
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
}

// Find the list of matches, auto-call explode
function checkMatches(callback){
	var matchLists = findMatches();
	
	// Turn all hint tokens into normal
	// board.forEach(function(boardCol, i){
		// boardCol.forEach(function (token, j){
			// if (token.state == HINT_STATE){
				// token.setState(NORMAL_STATE);
			// }
		// });
	// });
		
	// Found some matches, explode them!
	if(matchLists.length > 0){
		explode(deduplicateInMatchList(matchLists));
	} else {
		if (typeof(callback) == 'function') callback();
	}
}

// TODO: Optimization, some token does not need to search again
// Search the matching pair, using trace algorithm
function findMatches(){	
	var matchLists = [];
	
	board.forEach(function(boardCol, i){
		boardCol.forEach(function (token, j){
			traceAndAddToMatchList([token], token, 0, 1, false); // down
			traceAndAddToMatchList([token], token, 1, 0, false); // right
		});
	});

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
			inMatchlist = matchLists.some(function(match){
				return match.indexOf(token) > 0 && match.indexOf(nextToken) > 0;
			});
			
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

// Merge match lists that have the same tokens
function deduplicateInMatchList(matchLists){
	var commonToken = null;
	// var commonTokenList = [];
	for(i = 0; i < matchLists.length - 1; i++){
		for(j = i+1; j < matchLists.length; j++){
			if(commonToken = matchLists[i].intersectWith(matchLists[j])){
				// commonTokenList.push(commonToken);
				matchLists[i].merge(matchLists[j]);
				matchLists.splice(j,1);
				matchLists[i].push(commonToken);
				break;
			}	
		}
	}
	return matchLists;
}

// TODO: Animation Explosion effect
function explode(matchLists) {
	
	var waitTime = TOTAL_FRAME;
	matchLists.forEach(function(match){	
		var boom = false;
		match.forEach(function(token) {
			if(token.special){
				waitTime = token.special.explode(match, token);
				boom = true;
				return;
			}
		});
		
		if(!boom){
			var specialToken = decideStarToken(match);
				
			// Gather tokens to create special token
			if(specialToken){
				match.forEach(function(token) {
					moveToken(token, token.x, token.y, specialToken.x, specialToken.y, TOTAL_FRAME/2);
				});
			// Other match explodes normally	
			} else {
				match.forEach(function(token) {
					token.setState(EXPLODE_STATE);
				});
			}
		} 
	});
	
	waitForAnimationFinish(waitTime, function(){
		dropDown(matchLists);
	});
	
	// 4 matches = black hole
	// >=5 matches I = same color
	// >=5 matches L,T = shuriken
	function decideStarToken(match){
		var specialToken = null;
		
		// create black hole token at selected token, or the 2nd in match
		if (match.length == 4){
			var index = 1;
			
			match.forEach(function(token, i){
				if(firstSelectedToken != null && lastSelectedToken != null &&
				(token.isOnTheSameCellWith(firstSelectedToken) || token.isOnTheSameCellWith(lastSelectedToken))) {
					index = i;
					firstSelectedToken = null;
					lastSelectedToken = null;
				}
			});
			
			specialToken = match[index];
			match.splice(index,1);
			specialToken.special = new SunToken();
				console.log("4 match: " + specialToken);
			
		// 5-in-a-row match on a straight line
		} else if (match.length == 5){
			specialToken = match[2];
			match.splice(2,1);
			specialToken.setType(SPECIAL);
			
				console.log("5 I straight line: " + specialToken);
				
		// 5-in-a-row match on a zig zag line = shuriken
		} else if (match.length > 5){
			specialToken = match.pop();
			
				console.log(match.indexOf(specialToken) + "    5 L: " + specialToken);
				
			match.splice(match.indexOf(specialToken),1);
			specialToken.special = new MoonToken();
		}
		
		return specialToken;
	}
}

// TODO: Make animation of dropping
// Temp: Replace with above appropriate tokens
function dropDown(matchLists){
	// Merge all matches into An array of array
	// each is a token with same column, sort row from low to high
	var matches = [];
	matchLists.forEach(function(match){
		match.forEach(function(token){
			if(matches[token.col] == undefined){
				matches[token.col] = [];
			}
			
			matches[token.col].addToken(token);
		});
	});
	
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
				moveToken(token, token.x, token.y, token.x, token.y + (currentBlankRow - currentRow)*CELL_SIZE);
				
				board[i][currentBlankRow] = token;
				token.row = currentBlankRow;
		
				currentBlankRow--;
			}
			
			// Move all stock tokens? fill columns with new tokens
			if (currentRow < 0){				
				token = createToken(i, currentBlankRow);
				moveToken(token, token.x, token.y - matches[i].length*CELL_SIZE, token.x, token.y);
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
	toggleMouseMoveEvent(false);
	var f = 0;
	
	(function wait(){
		f++;
		if (f < frame){
			requestAnimationFrame(wait);
		} else {
			toggleClickEvent(true);
			toggleMouseMoveEvent(true);
			if (typeof(callback) == 'function'){
				callback();
			}
		}
	})();
}

// Move a token from start to end position
function moveToken(token, startX, startY, endX, endY, totalFrame){
	
	totalFrame = totalFrame == null ? TOTAL_FRAME : totalFrame;
	
	var frame = 0;
	var deltaX = (endX - startX) / totalFrame;
	var deltaY = (endY - startY) / totalFrame;
	token.x = startX;
	token.y = startY;
	
	(function move(){
				   
		// Change it into new position  
		token.x += deltaX;
		token.y += deltaY;
	
		frame++;
		if (frame < totalFrame){
			requestAnimationFrame(move);
		} else {
			token.x = endX;
			token.y = endY;
		}
	})();
}

// TODO: remove hint after 10 sec, or after they match
// Find all possible matches
function hint(e){
	var hintList = getHintList();
	
	if (hintList.length == 0){
		scamble(checkMatches);
	}
		
	// console.log("================Check Hint===================");
	// hintList.forEach(function (hint){
		// hint.forEach(function(token){
			// token.setState(HINT_STATE);
			// console.log(token);
		// });
		// console.log("---");
	// });
	
	// Randomly display a hint
	var randomIndex = Math.round(Math.random()*(hintList.length-1));
	hintList[randomIndex].forEach(function(token){
		token.setState(HINT_STATE);
	});
	
}

// TODO: remove duplicate in hintList
// Find all possible matches [[pair1, pair1], [pair2, pair2]...]
function getHintList(){
	var hintList = [];
	
	board.forEach(function(boardCol, i){
		boardCol.forEach(function (token, j){
			traceAndAddToPotentialList([token], token, 1, 0, token.type); // down
			traceAndAddToPotentialList([token], token, 0, 1, token.type); // right
		});
	});
	
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