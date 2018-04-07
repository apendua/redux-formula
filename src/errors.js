
const format = (message, details) => {
  if (details) {
    const newMessage = `${message} // at ${details.line + 1}:${details.from + 1}`;
    if (details.lineContent) {
      // let ruler = '';
      // while (ruler.length < details.from) {
      //   ruler += ' ';
      // }
      // while (ruler.length <= details.to) {
      //   ruler += '^';
      // }
      const tokenPosition = details.lineContent
        .split('').map((c, i) => (details.from === i ? `${c}\u034E` : c)).join('');
      return `${newMessage}\n${tokenPosition}\n`;
    }
    return newMessage;
  }
  return message;
};

export class AnyError extends Error {
  constructor(message, details) {
    super(format(message, details));
    Object.assign(this, { details });
  }
}

export class ParseError extends AnyError {
}

export class LexicalError extends AnyError {
}
