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
class BoardState{
    constructor(){
        this.Num = 8;
        this.tile = [];

        this.init();
    }
    Get(x,y){
        return this.tile[y][x];
    }
    Set(x,y,value){
        if (![0, 1, 2].includes(value)) throw new Error("不正な値です");
        this.tile[y][x] = value;
    }
    IsEmpty(x,y){
        return this.Get(x,y) === 0;
    }
    IsInside(x,y){
        return x >= 0 && x < this.Num && y >= 0 && y < this.Num;
    }

    init(){
        for(let i=0; i<this.Num; i++){
            this.tile.push(new Array(this.Num).fill(0));
        }

        this.Set(3,3,2);
        this.Set(3,4,1);
        this.Set(4,3,1);
        this.Set(4,4,2);
    }
}

class BoardMove{
    constructor(boardState){
        this.board = boardState;
    }

    reverseTile(tx,ty,turn){
        let tiles = this.getFlippable(tx,ty,turn);
        
        if(tiles.length == 0) throw new Cancel("ひっくり返せる石がありません");
        
        for(let [x,y] of tiles){
            this.board.Set(x, y, turn);
        }
    }

    getFlippable(tx,ty,turn){
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

        while(this.board.IsInside(x,y)){
            if(this.board.IsEmpty(x,y)) break;
            if(this.board.Get(x,y) == turn){
                return tiles;
            }

            tiles.push([x,y]);

            x += dx;
            y += dy;
        }

        return [];
    }
}

class CoordinateConverter{
    constructor(){
        this.Size = 30;
        this.Offset = 100;
    }
    CoordToTile(cx, cy){
        return [
            Math.floor((cx - this.Offset) / this.Size),
            Math.floor((cy - this.Offset) / this.Size)
        ];
    }
    TileToCoord(tx, ty){
        return [
            this.Offset + this.Size * tx,
            this.Offset + this.Size * ty
        ]
    };
}

//盤面の描画処理だけ外に分けた
class BoardRender{
    constructor(board, converter){
        this.board = board;
        this.converter = converter;
    }

    draw() {
        for (let y = 0; y < this.board.Num; y++) {
            for (let x = 0; x < this.board.Num; x++) {
                this.drawBoard(x, y);
                this.drawDisk(x, y);
            }
        }
    }

   drawBoard(tx, ty) {
        ctx.fillStyle = "green";
        const [cx,cy] = this.converter.TileToCoord(tx, ty);
        ctx.fillRect(cx,cy,this.converter.Size,this.converter.Size);
        ctx.strokeRect(cx,cy,this.converter.Size,this.converter.Size);
    }

    drawDisk(tx, ty){
        const disk = this.board.Get(tx,ty);
        if(disk === 0) return;

        const [cx,cy] = this.converter.TileToCoord(tx, ty);

        ctx.beginPath();
        ctx.fillStyle = (disk === 1)? "black" : "white";
        ctx.arc(
            cx + this.converter.Size/2,
            cy + this.converter.Size/2, 
            this.converter.Size/2, 
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
        this.board = new BoardState();
        this.converter = new CoordinateConverter();
        this.boardMove = new BoardMove(this.board);
        this.render = new BoardRender(this.board,this.converter);
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
            let [x,y] = this.converter.CoordToTile(event.offsetX, event.offsetY);
            if(this.board.Get(x,y) !== 0) throw new Cancel("そのマスは埋まっています")
            //クリックした場所にひっくり返せる石があるか判別してひっくり返す
            this.boardMove.reverseTile(x,y,this.turn);
            //押した場所に石を置く
            this.board.Set(x,y,this.turn);
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