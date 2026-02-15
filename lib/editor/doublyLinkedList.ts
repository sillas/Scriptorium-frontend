type listNodeType<T> = T extends { id: string } ? T : never;
export interface ListNodeValue<T> {
    startIdExclusive?: string, 
    categoryField?: string, 
    categoryId?: string
}
export class ListNode<T> {
    id: string;
    data: T;
    next: ListNode<T> | null = null;
    prev: ListNode<T> | null = null;

    constructor(data: listNodeType<T>) {
        this.id = data.id;
        this.data = data;
    }
}

export class DoublyLinkedList<T extends { id: string }> {
    private head: ListNode<T> | null = null;
    private tail: ListNode<T> | null = null;
    private nodes = new Map<string, ListNode<T>>();

    create(data: listNodeType<T>[]): Array<string> {
        return data.map(item => {
            this.append(item);
            return item.id;
        });
    }

    append(data: listNodeType<T>): void {
        if(!data.id) {
            throw new Error("Data must have an 'id' property");
        }
        const node = new ListNode<T>(data);
        this.nodes.set(data.id, node);

        if (!this.tail) {
            this.head = node;
            this.tail = node;
            return;
        }

        node.prev = this.tail;
        this.tail.next = node;
        this.tail = node;
    }

    addAfter(id: string, data: listNodeType<T>): void {
        const currentNode = this.nodes.get(id);
        if (!currentNode) {
            throw new Error(`Node with id ${id} not found`);
        }

        const newNode = new ListNode<T>(data);
        this.nodes.set(data.id, newNode);

        newNode.prev = currentNode;
        newNode.next = currentNode.next;

        if (currentNode.next) {
            currentNode.next.prev = newNode;
        } else {
            this.tail = newNode;
        }

        currentNode.next = newNode;
    }

    addBefore(id: string, data: listNodeType<T>): void {
        const currentNode = this.nodes.get(id);
        if (!currentNode) {
            throw new Error(`Node with id ${id} not found`);
        }

        const newNode = new ListNode<T>(data);
        this.nodes.set(data.id, newNode);

        newNode.next = currentNode;
        newNode.prev = currentNode.prev;

        if (currentNode.prev) {
            currentNode.prev.next = newNode;
        } else {
            this.head = newNode;
        }

        currentNode.prev = newNode;
    }

    remove(id: string): T | null {
        const node = this.nodes.get(id);
        if (!node) return null;

        if (node.prev) node.prev.next = node.next;
        else this.head = node.next;

        if (node.next) node.next.prev = node.prev;
        else this.tail = node.prev;

        this.nodes.delete(id);
        return node.data;
    }

    get(id: string, useNode?: boolean): T | ListNode<T> | null {
        const node = this.nodes.get(id) ?? null;
        if (useNode) return node;
        return node?.data ?? null;
    }

    getNext(id: string): T | null {
        const node = this.nodes.get(id);
        return node?.next?.data ?? null;
    }

    getPrev(id: string): T | null {
        const node = this.nodes.get(id);
        return node?.prev?.data ?? null;
    }

    swap(id1: string, id2: string): void {
        
        let node1 = this.nodes.get(id1);
        let node2 = this.nodes.get(id2);

        if (!node1) {
            throw new Error(`Node with id ${id1} not found`);
        }

        if (!node2) {
            throw new Error(`Node with id ${id2} not found`);
        }

        if (id1 === id2) return;

        if(node2.next === node1) {
            [node1, node2] = [node2, node1];
        }

        if (node1.next === node2 || node2.next === node1) {
            node1.prev && (node1.prev.next = node2);
            node2.next && (node2.next.prev = node1);

            [node1.next, node2.prev] = [node2.next, node1.prev];
            node1.prev = node2;
            node2.next = node1;
        } else {
            node1.prev && (node1.prev.next = node2);
            node1.next && (node1.next.prev = node2);

            node2.prev && (node2.prev.next = node1);
            node2.next && (node2.next.prev = node1);

            [node1.prev, node2.prev] = [node2.prev, node1.prev];
            [node1.next, node2.next] = [node2.next, node1.next];
        }

        if (this.head === node1) this.head = node2;
        else if (this.head === node2) this.head = node1;
        
        if (this.tail === node1) this.tail = node2;
        else if (this.tail === node2) this.tail = node1;
    }

    clear(): void {
        this.head = null;
        this.tail = null;
        this.nodes.clear();
    }

    *values(): Generator<T> {

        let current = this.head;
        while (current) {
            yield current.data;
            current = current.next;
        }
    }

    size(): number {
        return this.nodes.size;
    }
}