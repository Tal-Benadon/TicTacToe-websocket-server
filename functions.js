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
                location: [i, j]
            })
        }
        gameBoard.push(buttonRow)
    }
    return gameBoard
}

module.exports = { createBoard }