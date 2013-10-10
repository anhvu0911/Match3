/*!
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
var RED = 0;
var ORANGE = 1;
var YELLOW = 2;
var GREEN = 3;
var BLUE = 4;
var MAGENTA = 5;
var PURPLE = 6;

// Token state
var NORMAL_STATE = 0;
var EXPLODE_HORIZONTAL_STATE = 1;
var EXPLODE_VERTICAL_STATE = 2;
var SELECT_STATE = 3;
var HOVER_STATE = 4;
var HINT_STATE = 5;

var requestAnimationFrame;
var gameCanvas;
var context;
var gridCanvas;
var gridContext;
var board = [];

// Image resources
var slashImg;
var shineImg;

// =============================================
// OVERRIDE METHOD
// =============================================

// If two arrays intersect, return true!
Array.prototype.hasCommonElement = function(array){
	for(var i = 0; i < array.length; i++){
		if(this.indexOf(array[i]) >= 0){
			return true;
		}
	}
	return false;
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
		if(token.row < this[i].row){
			break;
		}
	}
	this.splice(i,0,token);
	
	return this;
}

//========================================================
// CLASS
//========================================================

function Cell(col, row){
	this.col = col;
	this.row = row;
}

function Token(col, row, type, img){
	this.row = row;
	this.col = col;
	this.type = type;
	this.selected = false;
	this.state = NORMAL_STATE;
	this.img = new Image();
	this.img.src = IMAGE_SET + img;
	
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
	
	this.setState = function(state){
		if( this.state != state){
			this.state = state;
			switch(state){
				case EXPLODE_HORIZONTAL_STATE:
					this.draw = drawExplosionHorizontal;
					half1x = this.x;
					half1y = this.y;
					half2x = this.x;
					half2y = this.y;
					break;
				case EXPLODE_VERTICAL_STATE:
					this.draw = drawExplosionVertical;
					half1x = this.x;
					half1y = this.y;
					half2x = this.x;
					half2y = this.y;
					break;
				case SELECT_STATE:
					this.draw = drawSelected;	
					break;
				case HOVER_STATE:
					this.draw = drawHover;
					break;
				case HINT_STATE:
					this.draw = drawHint;
					shineX = this.x - shineImg.width/2;
					break;
				default:
					this.draw = drawNormal;
			}
		}
	}
	
	this.draw = drawNormal;
	
	function drawNormal(){
		context.drawImage(this.img, this.x, this.y);
	}
	
	// var alpha = 1;
	// var deltaAlpha = 1 / (TOTAL_FRAME);
	// function drawExplosionHorizontal(){
		// alpha -= deltaAlpha;
		// if(alpha > 0){
			// context.globalAlpha = alpha;
			// context.drawImage(this.img, this.x, this.y, TOKEN_SIZE, TOKEN_SIZE);
			// context.globalAlpha = 1.0;
		// }		
	// }

	
	// For drawing explosion
	var half1x = this.x;
	var half1y = this.y;
	var half2x = this.x; // use for horizontal slash
	var half2y = this.y; // use for vertical slash
	var delta = (TOKEN_SIZE/4) / (TOTAL_FRAME/2);
	var alpha = 1;
	var deltaAlpha = 1 / (TOTAL_FRAME / 2);
	
	function drawExplosionHorizontal(){
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

	function drawExplosionVertical(){
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
			this.setState(NORMAL_STATE);
		}
	}
	
}