import createElement from './createElement.js'
import { render, useState } from './render.js'

const MyyReact = {
    createElement,
    render,
    useState
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
// function App (props) {
//     return <h1>
//         <div>hello function component</div>
//     </h1>
// }
// const element = <App name="foo" />
// MyyReact.render(element, document.querySelector("#root"))



/** @jsx MyyReact.createElement */
function Counter () {
    const frameworks = ['React', 'Vue', 'Svelte'];
    const [state, setState] = MyyReact.useState(1);
    const [framework, setFramework] = MyyReact.useState("React");

    return (
        <div>
            <h1>hello, this is {framework}!!</h1>
            <button onClick={() => {
                setFramework(() => frameworks[state % frameworks.length])
                setState(c => c + 1)
            }}>change</button>
            <h1 >
                Count: {state}
            </h1>
        </div>
    )
}
MyyReact.render(<Counter />, document.getElementById("root"));