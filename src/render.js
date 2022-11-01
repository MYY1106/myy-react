let nextUnitOfWork = null;
let currentRoot = null; // 最后一次 commit 到 DOM 的一棵 Fiber Tree
let wipRoot = null;
let wipFiber = null; // 正在执行的 Fiber
let hookIndex = null;
let deletions = null;

// 一旦我们开始渲染，在整棵 element tree 渲染完成之前程序是不会停止的。如果这棵 element tree 过于庞大，它有可能会阻塞主进程太长时间。如果浏览器需要做类似于用户输入或者保持动画流畅这样的高优先级任务，则必须等到渲染完成为止。
// 因此，我们将渲染工作分成几个小部分，在完成每个单元后，如果需要执行其他操作，我们将让浏览器中断渲染。
// 我们使用 requestIdleCallback 构建循环。你可以把 requestIdleCallback 当作是一个 setTimeout，但在这里浏览器将在主线程空闲时进行回调，而不是指定回调何时运行。
// element.props.children.forEach(child => render(child, dom));
requestIdleCallback(workLoop);

const isEvent = key => key.startsWith("on");
const isProperty = key => key !== "children" && !isEvent(key);
const isNew = (prev, next) => key => prev[key] !== next[key];
const isGone = (next) => key => !(key in next);

export function render (element, container) {
    console.log('render');
    wipRoot = nextUnitOfWork = { // 们会跟踪 Fiber Tree 的根节点。我们称它为「进行中的 root」
        dom: container,
        props: {
            children: [element]
        },
        alternate: currentRoot
    }
    deletions = [];
}

function workLoop (deadline) {
    console.log('workLoop');
    let shouldYield = false;

    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork); // 该函数不仅会执行工作单元，还会返回下一个工作单元
    }
    shouldYield = deadline.timeRemaining() < 1; // requestIdleCallback 还为我们提供了 deadline 参数。我们可以用它来检查在浏览器需要再次控制之前我们有多少时间。

    // 一旦完成所有工作（直到没有 nextUnitOfWork)，我们便将整个 Fiber Tree 交给 DOM
    if (!nextUnitOfWork && wipRoot) {
        commitRoot();
    }

    requestIdleCallback(workLoop); // 我们使用 requestIdleCallback 构建循环。你可以把 requestIdleCallback 当作是一个 setTimeout，但在这里浏览器将在主线程空闲时进行回调，而不是指定回调何时运行。
}

function performUnitOfWork (fiber) {
    console.log('performUnitOfWork');

    // 检查 fiber.type 是否是 function, 根据不同的结果来使用不同的更新函数
    const isFunctionComponent = fiber.type instanceof Function;
    if (isFunctionComponent) {
        updateFunctionComponent(fiber);
    } else {
        updateHostComponent(fiber);
    }

    // 将「添加节点至 DOM」这个动作延迟至所有节点 render 完成。这个动作也被称为 commit。
    // 为什么要分阶段：每当我们在处理一个 React element 时，我们都会添加一个新的节点到 DOM 中，而浏览器在渲染完成整个树之前可能会中断我们的工作。在这种情况下，用户将会看不到完整的 UI。
    // if (fiber.parent) {
    //     fiber.parent.dom.appendChild(fiber.dom); // 将这个fiber的dom append到它的父元素上
    // }

    // TODO return next unit of work
    // 最后，我们选出下一个工作单元。首先寻找 child ,其次 sibling ,然后是 uncle （ parent 的 sibling）。
    if (fiber.child) { // 如果有child，则将child作为下一个工作单元
        return fiber.child;
    }
    // 通过下面找到 fiber的sibling 或者 上级的sibling(uncle)
    let nextFiber = fiber;
    while (nextFiber) {
        if (nextFiber.sibling) {
            return nextFiber.sibling;
        }
        nextFiber = nextFiber.parent;
    }
}

function reconcileChildren (wipFiber, elements) {
    console.log('reconcileChildren');

    let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
    let prevSibling = null;

    for (let i = 0; i < elements.length || (oldFiber !== null && oldFiber !== undefined); i++) {
        // 为每一个child创建fiber对象
        const element = elements[i];
        let newFiber = null;

        const sameType = oldFiber && element && oldFiber.type === element.type;

        if (sameType) {
            newFiber = {
                type: oldFiber.type,
                dom: oldFiber.dom,
                props: element.props,
                parent: wipFiber,
                alternate: oldFiber, // 这个属性是对旧 Fiber 的链接，这个旧 Fiber 是我们在在上一个 commit phase 向 DOM commit 的 Fiber。
                effectTag: "UPDATE"
            }
        }
        if (element && !sameType) {
            newFiber = {
                type: element.type,
                dom: null,
                props: element.props,
                parent: wipFiber,
                alternate: null,
                effectTag: "PLACEMENT"
            }
        }
        if (oldFiber && !sameType) {
            oldFiber.effectTag = "DELETION";
            deletions.push(oldFiber);
        }

        if (oldFiber) {
            oldFiber = oldFiber.sibling || null;
        }

        // 判断应该是加在 父元素的child上 还是 上一个兄弟元素的sibling上
        if (i === 0) {
            wipFiber.child = newFiber;
        } else if (element) {
            prevSibling.sibling = newFiber;
        }
        prevSibling = newFiber;
    }
}

// 将「添加节点至 DOM」这个动作延迟至所有节点 render 完成。这个动作也被称为 commit。
// 为什么要分阶段：每当我们在处理一个 React element 时，我们都会添加一个新的节点到 DOM 中，而浏览器在渲染完成整个树之前可能会中断我们的工作。在这种情况下，用户将会看不到完整的 UI。
function commitRoot () {
    deletions.forEach(commitWork);
    commitWork(wipRoot.child);
    currentRoot = wipRoot; // 最后一次 commit 到 DOM 的一棵 Fiber Tree
    wipRoot = null;
}

/**
 * @description 将修改应用到dom上
 */
function commitWork (fiber) {
    if (!fiber) return;

    let parentFiber = fiber.parent;
    while (!parentFiber.dom) {
        parentFiber = parentFiber.parent;
    }
    const parentDom = parentFiber.dom;

    if (fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
        parentDom.appendChild(fiber.dom);
    } else if (fiber.effectTag === "UPDATE" && fiber.dom !== null) {
        updateDom(fiber.dom, fiber.alternate.props, fiber.props);
    } else if (fiber.effectTag === "DELETION") {
        commitDeletion(fiber, parentDom);
    }

    commitWork(fiber.child);
    commitWork(fiber.sibling);
}

function updateDom (dom, prevProps, nextProps) {
    console.log('updateDom');
    // 移除要删除的或改变的事件监听器
    Object.keys(prevProps)
        .filter(isEvent)
        .filter(key => !(key in nextProps) || isNew(prevProps, nextProps)(key))
        .forEach(name => {
            const eventType = name.toLowerCase().slice(2);
            dom.removeEventListener(eventType, prevProps[name]);
        })

    // 设置新的事件监听器
    Object.keys(nextProps)
        .filter(isEvent)
        .filter(isNew(prevProps, nextProps))
        .forEach(name => {
            const eventType = name.toLowerCase().slice(2);
            dom.addEventListener(eventType, nextProps[name]);
        })

    // 移除要删除的属性
    Object.keys(prevProps)
        .filter(isProperty)
        .filter(isGone(nextProps))
        .forEach(name => {
            dom[name] = ""
        })

    // 设置新的或者要修改的属性
    Object.keys(nextProps)
        .filter(isProperty)
        .filter(isNew(prevProps, nextProps))
        .forEach(name => {
            dom[name] = nextProps[name];
        })
}

function createDom (fiber) {
    console.log('createDom', fiber.type);
    const dom = fiber.type === 'TEXT_ELEMENT' ? document.createTextNode("") : document.createElement(fiber.type);

    updateDom(dom, {}, fiber.props);
    // for (const key in fiber.props) {
    //     if (key !== 'children') {
    //         dom[key] = fiber.props[key];
    //     }
    // }

    return dom
}

function updateFunctionComponent (fiber) {
    wipFiber = fiber;
    hookIndex = 0;
    wipFiber.hooks = [];

    const children = [fiber.type(fiber.props)]; // 在 updateFunctionComponent 中，我们执行函数以获取children 。一旦我们拿到了 children ，reconciliation 的过程其实是一样的。
    console.log(children);
    reconcileChildren(fiber, children);
}

function updateHostComponent (fiber) {
    if (!fiber.dom) {
        fiber.dom = createDom(fiber)
    }

    reconcileChildren(fiber, fiber.props.children);
}

function commitDeletion (fiber, parentDom) {
    if (fiber.dom) {
        parentDom.removeChild(fiber.dom)
    } else {
        commitDeletion(fiber.child, parentDom)
    }
}

export function useState (initial) {
    const oldHook =
        wipFiber.alternate &&
        wipFiber.alternate.hooks &&
        wipFiber.alternate.hooks[hookIndex]; // 拿到旧的 hook

    const hook = {
        state: oldHook ? oldHook.state : initial,
        queue: []
    };

    const actions = oldHook ? oldHook.queue : [];

    actions.forEach(action => {
        console.log(hook.state);
        hook.state = action(hook.state);
    })

    const setState = (action) => {
        hook.queue.push(action);

        wipRoot = {
            dom: currentRoot.dom,
            props: currentRoot.props,
            alternate: currentRoot
        };
        nextUnitOfWork = wipRoot; // rerender
        deletions = [];
    }

    wipFiber.hooks.push(hook);
    hookIndex++;
    return [hook.state, setState];
}