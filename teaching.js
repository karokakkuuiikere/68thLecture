let canvas = document.getElementById("screen");
let ctx = canvas.getContext("2d");

/*
JavaScriptのオセロゲーム
UI、パス、勝利判定は未実装
大体の処理はGame.onClickに固まってるのでそこ見て
*/


//クリックした場所に石が置けないときにキャンセルするもの
class Cancel extends Error{}

//盤面の状態を管理するクラス
class Board{
    constructor(){
        this.num = 8;
        this.size = 30;
        this.offset = 100;

        this.tile = [
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,1,2,0,0,0],
            [0,0,0,2,1,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0]
        ];
    }

    coordToTile(coordX,coordY){
        let x = Math.floor((coordX - this.offset) / this.size);
        let y = Math.floor((coordY - this.offset) / this.size);

        if(!this.isTileContain(x,y)) throw new Cancel("フィールド外です");

        return [x,y];
    }
   
    setTile(x,y,turn){
        if(this.tile[y][x] !== 0) throw new Cancel("そのマスは埋まっています");
        this.tile[y][x] = turn;
    }

    reverceTile(tx,ty,turn){
        let tiles = this.getFlipable(tx,ty,turn);
        
        if(tiles.length == 0) throw new Cancel("ひっくり返せる石がありません");
        
        for(let [x,y] of tiles){
            this.tile[y][x] = turn;
        }
    }

    getFlipable(tx,ty,turn){
        let tiles = [];
        const directions = [
            [-1, -1], [0, -1], [1, -1],
            [-1,  0],          [1,  0],
            [-1,  1], [0,  1], [1,  1]
        ];

        for(let [x,y] of directions){
            tiles.push(...this.throwRay(tx,ty,x,y,turn));
        }

        return tiles;
    }

    throwRay(x,y,dx,dy,turn){
        let tiles=[];

        x += dx;
        y += dy;

        while(this.isTileContain(x,y)){
            if(this.tile[y][x] == 0) break;
            if(this.tile[y][x] == turn){
                return tiles;
            }

            tiles.push([x,y]);

            x += dx;
            y += dy;
        }

        return [];
    }

    isTileContain(x,y){
        return x >= 0 && x < this.num && y >= 0 && y < this.num;
    }
}

//盤面の描画処理だけ外に分けた
class BoardRender{
    constructor(board){
        this.board = board;
    }

    draw() {
        for (let y = 0; y < this.board.num; y++) {
            for (let x = 0; x < this.board.num; x++) {
                this.drawBoard(x, y);
                this.drawDisk(x, y);
            }
        }
    }

    drawBoard(x, y) {
        ctx.fillStyle = "green";
        const px = this.board.offset + x*this.board.size;
        const py = this.board.offset + y*this.board.size;
        ctx.fillRect(px, py, this.board.size, this.board.size);
        ctx.strokeRect(px, py, this.board.size, this.board.size);
    }

    drawDisk(x, y){
        const disk = this.board.tile[y][x];
        if(disk === 0) return;

        ctx.beginPath();
        ctx.fillStyle = (disk === 1)? "black" : "white";
        ctx.arc(
            this.board.offset + this.board.size/2 + x*this.board.size, 
            this.board.offset + this.board.size/2 + y*this.board.size, 
            this.board.size/2, 
            0, 2*Math.PI);
        ctx.fill();
    }
}

class Button{
    constructor(x,y,w,h,event){
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;

        this.e = event;
    }
    draw(){
        ctx.strokeRect(this.x,this.y,this.w,this.h);
    }
    onClick(x,y){
        if(!(x >= this.x && x <= this.x + this.w && y >= this.y && y <= this.y + this.h)) return;
        this.e();
    }
}

//ゲーム全体の状態を管理するクラス
class Game{
    constructor(){
        this.turn = 1;
        this.board = new Board();
        this.render = new BoardRender(this.board);
        this.passBtn = new Button(375,150,100,30,() => this.switchTurn());

        this.init();
    }

    init(){
        this.render.draw();
        this.passBtn.draw();
    }

    onClick(event){
        this.passBtn.onClick(event.offsetX, event.offsetY);
        try{
            //クリック座標からマス目を取得する
            let [x,y] = this.board.coordToTile(event.offsetX, event.offsetY);
            if(this.board.tile[y][x] !== 0) throw new Cancel("そのマスは埋まっています")
            //クリックした場所にひっくり返せる石があるか判別してひっくり返す
            this.board.reverceTile(x,y,this.turn);
            //押した場所に石を置く
            this.board.setTile(x,y,this.turn);
        }
        //押した場所が[場外 / ひっくり返せない / すでに置いてある]場合にキャンセルする
        catch(error)
        {
            if(error instanceof Cancel){
                console.log(error.message);
                return;
            }
            //キャンセル以外のエラーは普通に表示
            throw error;
        }

        //盤面の描画と手番の入れ替え
        this.render.draw();
        this.switchTurn();
    }

    switchTurn(){
        this.turn = (this.turn == 1)? 2:1;
    }
}

let game = new Game();

canvas.addEventListener("click",e => game.onClick(e));