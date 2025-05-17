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
    constructor(num = 8, size = 30, offset = 100){
        this.Num = num;
        this.Size = size;
        this.Offset = offset;
        this.tile = [];

        this.init();
    }
    //指定マスの状態を取得
    Get(x,y){
        return this.tile[y][x];
    }
    //指定マスの状態を変更
    //0:空きマス、1:黒、2:白
    Set(x,y,value){
        if (![0, 1, 2].includes(value)) throw new Error("不正な値です");
        this.tile[y][x] = value;
    }
    //指定マスが空いているか
    IsEmpty(x,y){
        return this.Get(x,y) === 0;
    }
    //指定マスが盤面内か
    IsInside(x,y){
        return x >= 0 && x < this.Num && y >= 0 && y < this.Num;
    }
    //指定座標のマスを取得
    CoordToTile(cx, cy){
        return [
            Math.floor((cx - this.Offset) / this.Size),
            Math.floor((cy - this.Offset) / this.Size)
        ];
    }
    //指定マスの座標を取得
    TileToCoord(tx, ty){
        return [
            this.Offset + this.Size * tx,
            this.Offset + this.Size * ty
        ]
    };

    //盤面の初期化
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

class BoardLogic{
    constructor(boardState){
        this.turn = 1;
        this.board = boardState;
    }

    GameLogic(cx,cy){
        const [tx,ty] = this.board.CoordToTile(cx, cy);

        try
        {
            //例外は早期リターン
            if(!this.board.IsInside(tx,ty)) throw new Cancel("場外です");
            if(!this.board.IsEmpty(tx,ty)) throw new Cancel("そのマスは埋まっています");

            //範囲内の時にだけ置ける石があるか判定
            const tiles = this.getFlippable(tx,ty);
            if(tiles.length == 0) throw new Cancel("ひっくり返せる石がありません");

            //盤面に適用
            this.board.Set(tx,ty,this.turn);
            for(let [x,y] of tiles){
                this.board.Set(x, y, this.turn);
            }
        }
        catch(e)
        {
            if(e instanceof Cancel){
                console.log(e.message);
                return;
            }else{
                throw e;
            }
        }

        //手番の入れ換え
        this.switchTurn();
    }

    getFlippable(tx,ty){
        let tiles = [];
        const directions = [
            [-1, -1], [0, -1], [1, -1],
            [-1,  0],          [1,  0],
            [-1,  1], [0,  1], [1,  1]
        ];

        for(let [x,y] of directions){
            tiles.push(...this.getFlippableOneDir(tx,ty,x,y));
        }

        return tiles;
    }

    getFlippableOneDir(x,y,dx,dy){
        let tiles=[];

        x += dx;
        y += dy;

        while(this.board.IsInside(x,y)){
            if(this.board.IsEmpty(x,y)) break;
            if(this.board.Get(x,y) == this.turn){
                return tiles;
            }

            tiles.push([x,y]);

            x += dx;
            y += dy;
        }

        return [];
    }


    switchTurn(){
        this.turn = (this.turn == 1)? 2:1;
    }
}

//盤面の描画処理だけ外に分けた
class BoardRender{
    constructor(board){
        this.board = board;
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
        const [cx,cy] = this.board.TileToCoord(tx, ty);
        ctx.fillRect(cx,cy,this.board.Size,this.board.Size);
        ctx.strokeRect(cx,cy,this.board.Size,this.board.Size);
    }

    drawDisk(tx, ty){
        const disk = this.board.Get(tx,ty);
        if(disk === 0) return;

        const [cx,cy] = this.board.TileToCoord(tx, ty);

        ctx.beginPath();
        ctx.fillStyle = (disk === 1)? "black" : "white";
        ctx.arc(
            cx + this.board.Size/2,
            cy + this.board.Size/2, 
            this.board.Size/2, 
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
        this.board = new BoardState();
        this.boardLogic = new BoardLogic(this.board);
        this.boardRender = new BoardRender(this.board);
        this.passBtn = new Button(375,150,100,30,() => this.switchTurn());

        this.init();
    }

    init(){
        this.boardRender.draw();
        this.passBtn.draw();
    }

    onClick(event){
        this.boardLogic.GameLogic(event.offsetX, event.offsetY);
        this.boardRender.draw();

        this.passBtn.onClick(event.offsetX, event.offsetY);
    }
}

let game = new Game();

canvas.addEventListener("click",e => game.onClick(e));