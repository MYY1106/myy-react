import createElement from './createElement.js'
import render from './render.js'

const MyyReact = {
    createElement,
    render
};

// /** @jsx MyyReact.createElement */
// const element = (
//     <div style="background: salmon">
//         <h1>Hello World</h1>
//         <h2 style="text-align:right">from MyyReact</h2>
//     </div>
// )
// MyyReact.render(element, document.getElementById("root"));

// // ---------等价于下面------------
// // const element = MyyReact.createElement(
// //     "div",
// //     { id: "foo" },
// //     MyyReact.createElement("a", null, "bar"),
// //     MyyReact.createElement("b")
// // );
// MyyReact.render(element, document.getElementById("root"));



// /** @jsx MyyReact.createElement */
// const container = document.getElementById("root")
// const updateValue = e => {
//     rerender(e.target.value)
// }
// const rerender = value => {
//     const element = (
//         <div>
//             <input onInput={updateValue} value={value} />
//             <h2>Hello {value}</h2>
//         </div>
//     )
//     MyyReact.render(element, container)
// }
// rerender("World")



/** @jsx MyyReact.createElement */
function App (props) {
    return <h1>
        <div>hello function component</div>
    </h1>
}
const element = <App name="foo" />
MyyReact.render(element, document.querySelector("#root"))



/** @jsx MyyReact.createElement */
// function Counter() {
//   const [state, setState] = MyyReact.useState(1)
//   return (
//     <h1 onClick={() => setState(c => c + 1)}>
//       Count: {state}
//     </h1>
//   )
// }
// const element = <Counter />
// const container = document.getElementById("root")
// MyyReact.render(element, container);