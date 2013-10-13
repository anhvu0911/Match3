/*
 * a match 3 game, practice on using HTML5 canvas 
 * https://github.com/anhvu0911/Match3
 *
 * Author: Nguyen Huu Anh Vu (https://github.com/anhvu0911)
 *
 * Date: 2013-04-09
 */

var TOKEN_SIZE = 50;
var SPACE = 15;
var CELL_SIZE = TOKEN_SIZE + SPACE;
var TOKEN_PER_ROW = 8;
var TOKEN_PER_COL = 8;
var BOARD_WIDTH = CELL_SIZE * TOKEN_PER_ROW - SPACE; //Minus the space of last tokens
var BOARD_HEIGHT = CELL_SIZE * TOKEN_PER_ROW - SPACE; //Minus the space of last tokens
var TOTAL_FRAME = 26;
var IMAGE_SET = "images/elemental/";
// var IMAGE_SET = "images/browsers/";

// 7 Token types
var NUMBER_OF_TOKEN_TYPE=5;
var RED = 0;
var ORANGE = 1;
var YELLOW = 2;
var BLUE = 3;
var GREEN = 4;
var MAGENTA = 5;
var PURPLE = 6;
var SPECIAL = 7; // 5-in-a-row match on a straight line = destroy same color token!

// Token state
var NORMAL_STATE = 0;
var SLASH_HORIZONTAL_STATE = 1;
var SLASH_VERTICAL_STATE = 2;
var SELECT_STATE = 3;
var HOVER_STATE = 4;
var HINT_STATE = 5;
var EXPLODE_STATE = 6;

var requestAnimationFrame;
var gameCanvas;
var context;
var gridCanvas;
var gridContext;
var board = [];

// Image resources
var slashImg;
var shineImg;
var sunImg;

// =============================================
// OVERRIDE METHOD
// =============================================

// If two arrays intersect, return true!
Array.prototype.intersectWith = function(array){
	for(var i = 0; i < array.length; i++){
		if(this.indexOf(array[i]) >= 0){
			return array[i];
		}
	}
	return null;
}

// Concat 2 arrays, no duplicate
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
		if(token.isOnTheSameCellWith(this[i])){
			return;
		}
		if(token.row < this[i].row){
			break;
		}
	}
	this.splice(i,0,token);
	
	return this;
}

//========================================================
// TOKEN
//========================================================

function Cell(col, row){
	this.col = col;
	this.row = row;
}

function Token(col, row, type, img){
	this.row = row;
	this.col = col;
	this.type = type;
	this.state = NORMAL_STATE;
	this.img = new Image();
	this.img.src = IMAGE_SET + img;
	this.special = null;
	
	this.isOnTheSameCellWith = function(token){
		return (this.row == token.row) && (this.col == token.col);
	}
	
	this.isAdjacentTo = function(token){
		return (((Math.abs(this.row - token.row) == 1) && (this.col == token.col)) // same column
			|| ((Math.abs(this.col - token.col) == 1) && (this.row == token.row))) // same row;
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
		
		// Chrome has not supported this yet
		// [board[tokenCol][tokenRow],board[thisCol][thisRow]] = [board[thisCol][thisRow],board[tokenCol][tokenRow]];
		// [board[tokenCol][tokenRow].row,board[thisCol][thisRow].row] = [board[thisCol][thisRow].row,board[tokenCol][tokenRow].row];
		// [board[tokenCol][tokenRow].col,board[thisCol][thisRow].col] = [board[thisCol][thisRow].col,board[tokenCol][tokenRow].col];
		
		this.calculateXY();
		token.calculateXY();
	}
	
	this.calculateXY = function(){
		this.x = this.col*CELL_SIZE + SPACE/2;
		this.y = this.row*CELL_SIZE + SPACE/2;
	}
	this.calculateXY();
	
	this.setType = function(type){
		this.type = type;
		switch(type){
			case RED:	 
				this.img.src = IMAGE_SET + "red.png"; 
				break;
			case ORANGE: 
				this.img.src = IMAGE_SET + "orange.png"; 
				break;
			case YELLOW: 
				this.img.src = IMAGE_SET + "yellow.png"; 
				break;
			case GREEN:	 
				this.img.src = IMAGE_SET + "green.png"; 
				break;
			case BLUE:	 
				this.img.src = IMAGE_SET + "blue.png"; 
				break;
			case MAGENTA:
				this.img.src = IMAGE_SET + "magenta.png"; 
				break;
			case PURPLE: 
				this.img.src = IMAGE_SET + "purple.png"; 
				break;
			case SPECIAL:
				this.img.src = IMAGE_SET + "special.png"; 
				this.special = new StarToken();
				break;
			default: 	 
				this.img.src = null; 
				return;
		}
	}
	this.setState = function(state){
		if(this.state != state){
			switch(state){
				case HOVER_STATE:
					if(this.state == SELECT_STATE) return;
					this.draw = drawHover;
					break;
				case SELECT_STATE:
					this.draw = drawSelected;	
					break;
				case SLASH_HORIZONTAL_STATE:
					this.draw = drawSlashHorizontal;
					half1x = this.x;
					half1y = this.y;
					half2x = this.x;
					half2y = this.y;
					break;
				case SLASH_VERTICAL_STATE:
					this.draw = drawSlashVertical;
					half1x = this.x;
					half1y = this.y;
					half2x = this.x;
					half2y = this.y;
					break;
				case EXPLODE_STATE:
					this.draw = drawExplode;
					break;
				case HINT_STATE:
					this.draw = drawHint;
					shineX = this.x - shineImg.width/2;
					break;
				default:
					this.draw = drawNormal;
			}
			
			this.state = state;
		}
	}
	
	this.draw = drawNormal;
	
	function drawNormal(){
		context.drawImage(this.img, this.x, this.y);
	}
	
	// Turn token to transparent
	// var explodeAlpha = 1;
	// var explodeDeltaAlpha = 1 / (TOTAL_FRAME);
	// function drawExplode(){
		// explodeAlpha -= explodeDeltaAlpha;
		// if(explodeAlpha > 0){
			// context.globalAlpha = explodeAlpha;
			// context.drawImage(this.img, this.x, this.y, TOKEN_SIZE, TOKEN_SIZE);
			// context.globalAlpha = 1.0;
		// }		
	// }
	
	// Zoom token out
	var deltaMinimize = (TOKEN_SIZE - 10) / (TOTAL_FRAME);
	var size = TOKEN_SIZE;
	function drawExplode(){
		if(size > 10){
			context.drawImage(this.img, this.x, this.y, size, size);
			this.x += deltaMinimize;
			this.y += deltaMinimize;
			size -= 2*deltaMinimize;
		}
	}

	// Break the token into halves
	var half1x = this.x;
	var half1y = this.y;
	var half2x = this.x; // use for horizontal slash
	var half2y = this.y; // use for vertical slash
	var delta = (TOKEN_SIZE/4) / (TOTAL_FRAME/2);
	var alpha = 1;
	var deltaAlpha = 1 / (TOTAL_FRAME / 2);
	
	function drawSlashHorizontal(){
		alpha -= deltaAlpha;
		if(alpha > 0){
			context.globalAlpha = alpha;
			context.drawImage(this.img, 0, 0, TOKEN_SIZE, TOKEN_SIZE/2, 
							  half1x, this.y, TOKEN_SIZE, TOKEN_SIZE/2);
			context.drawImage(this.img, 0, TOKEN_SIZE/2, TOKEN_SIZE, TOKEN_SIZE/2, 
							  half2x, this.y+TOKEN_SIZE/2, TOKEN_SIZE, TOKEN_SIZE/2);
			half1x -= delta;
			half2x += delta;
			context.globalAlpha = 1.0;
		}
	}

	function drawSlashVertical(){
		alpha -= deltaAlpha;
		if(alpha > 0){
			context.globalAlpha = alpha;
			context.drawImage(this.img, 0, 0, TOKEN_SIZE/2, TOKEN_SIZE, 
							  this.x, half1y, TOKEN_SIZE/2, TOKEN_SIZE);
			context.drawImage(this.img, TOKEN_SIZE/2, 0, TOKEN_SIZE/2, TOKEN_SIZE, 
							  this.x+TOKEN_SIZE/2, half2y, TOKEN_SIZE/2, TOKEN_SIZE);
			half1y -= delta;
			half2y += delta;
			context.globalAlpha = 1.0;
		}
	}
	
	function drawHover(){
		context.fillStyle = "#444";
		context.fillRect(this.col*CELL_SIZE, this.row*CELL_SIZE, CELL_SIZE, CELL_SIZE);
		context.drawImage(this.img, this.x, this.y);
	}
	
	function drawSelected(){
		context.strokeStyle = "lightgray";
		context.strokeRect(this.x, this.y, TOKEN_SIZE, TOKEN_SIZE);
		context.drawImage(this.img, this.x+SPACE/2, this.y+SPACE/2, TOKEN_SIZE-SPACE, TOKEN_SIZE-SPACE);
	}
	
	var shineX = 0;
	var deltaShineX = (TOKEN_SIZE + shineImg.width/2) / TOTAL_FRAME;
	function drawHint(){	
		context.drawImage(this.img, this.x, this.y);
		
		context.globalCompositeOperation = "source-atop";
		context.drawImage(shineImg, shineX, this.y);
		context.globalCompositeOperation = "source-over";
		
		shineX += deltaShineX;
		
		if(shineX > this.x + TOKEN_SIZE){
			// shineX = this.x - shineImg.width/2;
			this.setState(NORMAL_STATE);
		}
	}
}

// =============================================
// LEVEL OBJECTIVE
// =============================================
// - Score up to, within time
// - Collect certain token types (including special)
// - Destroy brick. Hard brick > Soft brick > Normal brick
// - Get certain token type into certain position (Into hear shape? Rectangle shape)


// =============================================
// COMBO MATCH
// =============================================
// red = paint, turn random tokens to a specific type
// orange = add turn/time, depend on level objective
// yellow = double score in 7 -> 12 seconds
// blue = show hint
// green = 
// magenta = turn 3 -> 6 random tokens to special
// purple = 

// =============================================
// SPECIAL TOKENS
// =============================================
// Sun = destroy neighbors
// Moon = destroy same row col
// Star = destroy same type
// Sun + Sun = Black hole, destroy neighbors x 2
// Sun + Moon = New Star, gather all tokens in X shape, turn into Star
// Sun + Star = New Sun, turn same type as Sun, into Sun, destroy as Sun
// Moon + Moon = Nova (Big Slash type), destroy 3 row, 3 col
// Moon + Star = New Moon, turn same type as Moon, into Moon, destroy as Moon
// Star + Star = Big Bang, destroy all tokens


// 4-in-a-row match = destroy adjacent tokens
function SunToken(){	
	this.draw = function(token){
		context.fillStyle="#fff";
		context.fillRect(token.x,token.y,TOKEN_SIZE,TOKEN_SIZE);
	}
	
	this.explode = function(match, token, excludeList){
	
		excludeList = (excludeList == null) ? [] : excludeList;
	
		//Explode tokens not in range
		match.forEach(function(t) {
			if(!t.isAdjacentTo(token) && !t.isOnTheSameCellWith(token)){
				t.setState(EXPLODE_STATE);
			}
		});
		
		var row = token.row;
		var col = token.col;
		
		// Explode neighbor tokens
		explodeAndAddToMatch(col-1,row-1); //top left
		explodeAndAddToMatch(col,row-1);	//top
		explodeAndAddToMatch(col+1,row-1);	//top right
		
		explodeAndAddToMatch(col-1,row);	// left
		explodeAndAddToMatch(col+1,row);    // right
		
		explodeAndAddToMatch(col-1,row+1);  // bottom left
		explodeAndAddToMatch(col,row+1);    // bottom
		explodeAndAddToMatch(col+1,row+1);  // bottom right
		
		function explodeAndAddToMatch(col, row){
			if(board[col] != undefined){
				var t = board[col][row];
				
				if (t != undefined){
					// moveToken(t, t.x, t.y, token.x, token.y, TOTAL_FRAME/2);
					t.setState(EXPLODE_STATE);
					match.push(t);
					
					// Trigger another special, but exclude this one!
					if(t.special && (excludeList.indexOf(t) < 0)){
						excludeList.addToken(token);
						t.special.explode(match,t, excludeList);
					}
				}
			}
		}
		
		return TOTAL_FRAME;
	}
}

// TODO: Trigger another special, but exclude this one!
// 5-in-a-row match zig zag line = destroy tokens on the same row + column
function MoonToken(){	
	this.draw = function(token){
		context.fillStyle="#34fe43";
		context.fillRect(token.x,token.y,TOKEN_SIZE,TOKEN_SIZE);
	}
	
	this.explode = function(match, token, excludeList){
		excludeList = (excludeList == null) ? [] : excludeList;
		
		var m = [];
		
		// Slash to top
		if(token.row > 0){
			for(var i = 0; i <= token.row - 1; i++){
				m.push([board[token.col][i], SLASH_VERTICAL_STATE, token.row-i]);
			}
			
			slash(board[token.col][token.row - 1].x + TOKEN_SIZE/2 + slashImg.height/2, 
				board[token.col][token.row - 1].y + TOKEN_SIZE, 
				board[token.col][0].x + TOKEN_SIZE/2 + slashImg.height/2, 
				board[token.col][0].y - TOKEN_SIZE/4,
				-Math.PI/2);
		}
		
		// Slash to bottom
		if(token.row < TOKEN_PER_ROW-1){
			for(var i = token.row + 1; i <= TOKEN_PER_ROW-1; i++){
				m.push([board[token.col][i], SLASH_VERTICAL_STATE, i - token.row - 1]);
			}
			
			slash(board[token.col][token.row + 1].x + TOKEN_SIZE/2 + slashImg.height/2, 
				board[token.col][token.row + 1].y - TOKEN_SIZE/4, 
				board[token.col][TOKEN_PER_ROW-1].x + TOKEN_SIZE/2 + slashImg.height/2, 
				board[token.col][TOKEN_PER_ROW-1].y + TOKEN_SIZE,
				Math.PI/2);
		}
		
		// Slash to left
		if(token.col > 0){
			for(var i = 0; i <= token.col - 1; i++){
				m.push([board[i][token.row], SLASH_HORIZONTAL_STATE, token.col - 1 - i]);
			}
			
			slash(board[token.col-1][token.row].x + TOKEN_SIZE, 
				board[token.col-1][token.row].y + TOKEN_SIZE/2 - slashImg.height/2,
				board[0][token.row].x - TOKEN_SIZE/4,
				board[0][token.row].y + TOKEN_SIZE/2 - slashImg.height/2,
				Math.PI);
		}
		
		// Slash to right
		if(token.col < TOKEN_PER_COL-1){
			for(var i = token.col + 1; i <= TOKEN_PER_COL-1; i++){
				m.push([board[i][token.row], SLASH_HORIZONTAL_STATE, i - token.col - 1]);
			}
			
			slash(board[token.col + 1][token.row].x - TOKEN_SIZE/4, 
				board[token.col + 1][token.row].y + TOKEN_SIZE/2 - slashImg.height/2,
				board[TOKEN_PER_COL-1][token.row].x + TOKEN_SIZE, 
				board[TOKEN_PER_COL-1][token.row].y + TOKEN_SIZE/2 - slashImg.height/2,
				0);
		}
		
		function slash(startX, startY, endX, endY, rotate){
			var frame = 0;
			var total_frame = TOTAL_FRAME / 2;
			var slashSectionLength = Math.round(total_frame/2);
			
			var deltaWidth = Math.abs((endX - startX) + (endY - startY)) / slashSectionLength;
			var width = deltaWidth;
			var height = slashImg.height;
			var deltaX = 0;
			var deltaY = 0;
			
			(function drawSlash(){
				context.translate(startX+deltaX, startY+deltaY);
				context.rotate(rotate);
				context.drawImage(slashImg, 0, 0, width, height);
				context.rotate(-rotate);
				context.translate(-startX-deltaX, -startY-deltaY);
			
				frame++;
				width += (frame <= slashSectionLength) ? deltaWidth : -deltaWidth;
				deltaX += (frame <= slashSectionLength) ? 0 : Math.cos(rotate) * deltaWidth;
				deltaY += (frame <= slashSectionLength) ? 0 : Math.sin(rotate) * deltaWidth;
				
				// Finish?
				if (frame < total_frame){
					requestAnimationFrame(drawSlash);
				}
			})();
		}
		
		waitForAnimationFinish(TOTAL_FRAME/2, function(){
			m.forEach(function (mm){
				match.push(mm[0]);
			
				waitForAnimationFinish(mm[2]*8, function(){
					mm[0].setState(mm[1]);
				});
				
				// TODO: Trigger another special, but exclude this one!
				if(mm[0].special && (excludeList.indexOf(mm[0]) < 0)){
					excludeList.addToken(token);
					mm[0].special.explode(match, mm[0], excludeList);
				}
			});
		});
		
		return TOTAL_FRAME + 8*Math.max(token.col, token.row, TOKEN_PER_COL - 1 - token.col, TOKEN_PER_ROW - 1 - token.row);
	}
}

// Dodegon
// 5-in-a-row match = Destroy all tokens of the same type
function StarToken(){	
	this.draw = function(token){
	}
	
	this.explode = function(match, token, excludeList, type){
		if(type != null){
			waitForAnimationFinish(TOTAL_FRAME, function(){
				dropDown([match]);
			});
		} else {
			type = Math.round(Math.random()*NUMBER_OF_TOKEN_TYPE);
		}
	
		excludeList = (excludeList == null) ? [] : excludeList;
	
		// TODO: If two special meets!, the whold board goes crazy!
		board.forEach(function(boardCol, i){
			boardCol.forEach(function (t, j){
				if (t.type == type || type == SPECIAL){
					match.push(t);
					t.setState(EXPLODE_STATE);
					
					// TODO: Trigger another special, but exclude this one!
					if(t.special && (excludeList.indexOf(t) < 0)){
						excludeList.addToken(token);
						t.special.explode(match, t, excludeList);
					}
				}
			});
		});
		
		return TOTAL_FRAME;
	}
}
