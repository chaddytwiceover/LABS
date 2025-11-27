# Tic Tac Toe - Neural Grid Challenge

A modern, cyberpunk-themed Tic Tac Toe game with AI opponents of varying difficulty levels.

## Features

- **Three AI Difficulty Levels**
  - **Casual**: Random moves with slight strategic preference
  - **Strategic**: Rule-based AI following classical tic-tac-toe strategy
  - **Expert**: Unbeatable AI using minimax algorithm with alpha-beta pruning

- **Modern UI/UX**
  - Cyberpunk-themed design with neon effects
  - Smooth animations and transitions
  - Fully responsive layout for mobile and desktop
  - Accessibility features including keyboard navigation and screen reader support

- **Game Features**
  - Choose to play as X or O
  - Persistent score tracking using localStorage
  - Visual winning line animations
  - Real-time game status updates

## How to Play

1. Open `index.html` in a modern web browser
2. Select your preferred AI difficulty level
3. Choose whether you want to play as X or O
4. Click on any empty cell to make your move
5. Try to get three in a row before the AI does!

## Technologies Used

- HTML5
- CSS3 (with modern features like CSS Grid, Flexbox, and CSS Custom Properties)
- Vanilla JavaScript (ES6+)
- No external dependencies

## Browser Support

Works on all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## Accessibility

- Keyboard navigation support (arrow keys, Enter, Space)
- ARIA labels for screen readers
- Focus indicators for better visibility
- Reduced motion support for users with motion sensitivity

## Development

Simply open the `index.html` file in your browser. No build process required!

For development with live reload, you can use any static file server:

```bash
# Using Python
python3 -m http.server 8080

# Using Node.js http-server
npx http-server -p 8080
```

## License

MIT License - Feel free to use and modify as needed.
