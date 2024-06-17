const createBoard = () => {
    let gameBoard = []
    let iterations = 3
    for (let i = 0; i < iterations; i++) {
        let buttonRow = []
        for (let j = 0; j < iterations; j++) {
            buttonRow.push({
                symbol: '',
                animationTrigger: 0,
                isInactive: false,
                isPlayed: false,
                location: [i, j]
            })
        }
        gameBoard.push(buttonRow)
    }
    return gameBoard
}


const updateSymbol = (row, col, symbol, gameBoard) => {
    // console.log(gameBoard[row][col]);
    if (!gameBoard[row][col].isPlayed) {
        // console.log("hihihihihi");
        gameBoard[row][col].symbol = symbol
        gameBoard[row][col].isPlayed = true
        return [...gameBoard]
    } else {
        console.log("false..");
        return false
    }
}

const checkBoard = (gameBoard, row, col, symbol) => {
    let iterations = 3
    let column = []
    let cross1 = []
    let cross2 = []
    let gameRow = gameBoard[row]
    let j = 0
    let k = 0

    for (let i = 0; i < iterations; i++) {
        cross1.push(gameBoard[j][i])
        j++
    }
    for (let i = iterations - 1; i >= 0; i--) {
        cross2.push(gameBoard[k][i])
        k++
    }
    for (let i = 0; i < iterations; i++) {
        column.push(gameBoard[i][col]);
    }
    if (gameRow.every(cell => cell.symbol === gameRow[0].symbol && cell.symbol !== '')) {

        console.log({ gameRow });
        return {

            gameWinner: symbol, gameEnded: true, gameBoard: gameBoard.map(row =>
                row.map(cell =>
                    !includesSubArray(gameRow.map(value => value.location), cell.location) ?
                        { ...cell, isInactive: true }
                        : cell
                )
            )
        }
    }
    if (column.every(cell => cell.symbol === column[0].symbol && cell.symbol !== '')) {
        console.log({ column });
        return {
            gameWinner: symbol, gameEnded: true, gameBoard: gameBoard.map(row =>
                row.map(cell =>
                    !includesSubArray(column.map(value => value.location), cell.location) ?
                        { ...cell, isInactive: true }
                        : cell
                )
            )
        }
    }
    if (cross1.every(cell => cell.symbol === cross1[0].symbol && cell.symbol !== '')) {
        return {
            gameWinner: symbol, gameEnded: true, gameBoard: gameBoard.map(row =>
                row.map(cell =>
                    !includesSubArray(cross1.map(value => value.location), cell.location) ?
                        { ...cell, isInactive: true }
                        : cell
                )
            )
        }
    }
    if (cross2.every(cell => cell.symbol === cross2[0].symbol && cell.symbol !== '')) {
        return {
            gameWinner: symbol, gameEnded: true, gameBoard: gameBoard.map(row =>
                row.map(cell =>
                    !includesSubArray(cross2.map(value => value.location), cell.location) ?
                        { ...cell, isInactive: true }
                        : cell
                )
            )
        }

    } else {
        return false
    }
}

const includesSubArray = (mainArray, subArray) => {
    return mainArray.some(element =>
        Array.isArray(element) &&
        element.length === subArray.length &&
        element.every((value, index) => value === subArray[index])
    );
}

module.exports = { createBoard, checkBoard, updateSymbol }