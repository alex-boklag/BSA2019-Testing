import CartParser from './CartParser';
import { parenthesizedExpression, exportAllDeclaration } from '@babel/types';
import { parseExpression } from '@babel/parser';

let parser;

beforeEach(() => {
	parser = new CartParser();
});

describe('CartParser - unit tests', () => {
	it('should create header error when a header is unexpected', () => {
		const contents = `Product name,Something,Quantity
			Mollis consequat,9.00,2
			Tvoluptatem,10.32,1
			Scelerisque lacinia,18.90,1
			Consectetur adipiscing,28.72,10
			Condimentum aliquet,13.90,1`;

		const errors = parser.validate(contents);

		expect(errors[0]).toHaveProperty("type", "header");
	})
	it('should create row error when a length of some string is unexpected', () => {
		const contents = `Product name,Price,Quantity
			Mollis consequat,9.00
			Tvoluptatem,10.32,1
			Scelerisque lacinia,18.90,1
			Consectetur adipiscing,28.72,10
			Condimentum aliquet,13.90,1`;

		const errors = parser.validate(contents);

		expect(errors[0]).toHaveProperty("type", "row");
	})
	it('should create cell error when a cell is empty string', () => {
		const contents = `Product name,Price,Quantity
			Mollis consequat,9.00,2
			,10.32,1
			Scelerisque lacinia,18.90,1
			Consectetur adipiscing,28.72,10
			Condimentum aliquet,13.90,1`;
		parser.createError = jest.fn();

		parser.validate(contents);

		expect(parser.createError).toHaveBeenCalledWith('cell', 2, 0,
			`Expected cell to be a nonempty string but received "".`
		);
	})
	it('should create cell error when a cell isn`t a number', () => {
		const contents = `Product name,Price,Quantity
			Mollis consequat,9.00,2
			Tvoluptatem,10.32,1
			Scelerisque lacinia,18.90,a
			Consectetur adipiscing,28.72,10
			Condimentum aliquet,13.90,1`;
		parser.createError = jest.fn();

		parser.validate(contents);

		expect(parser.createError).toHaveBeenCalledWith('cell', 3, 2,
			`Expected cell to be a positive number but received "a".`
		);
	})
	it('should create cell error when a cell is NaN', () => {
		const contents = `Product name,Price,Quantity
			Mollis consequat,9.00,2
			Tvoluptatem,10.32,1
			Scelerisque lacinia,18.90,1
			Consectetur adipiscing,28.72,NaN
			Condimentum aliquet,13.90,1`;
		parser.createError = jest.fn();

		parser.validate(contents);

		expect(parser.createError).toHaveBeenCalledWith('cell', 4, 2,
			`Expected cell to be a positive number but received "NaN".`
		);
	})
	it('should create cell error when a cell isn`t a positive number', () => {
		const contents = `Product name,Price,Quantity
			Mollis consequat,9.00,2
			Tvoluptatem,10.32,1
			Scelerisque lacinia,18.90,1
			Consectetur adipiscing,28.72,10
			Condimentum aliquet,13.90,-1`;
		parser.createError = jest.fn();

		parser.validate(contents);

		expect(parser.createError).toHaveBeenCalledWith('cell', 5, 2,
			`Expected cell to be a positive number but received "-1".`
		);
	})
	it('should create 6 errors', () => {
		const contents = `Product,Price,Quantity
			Mollis consequat,9.00
			,10.32,1
			Scelerisque lacinia,18.90,o
			Consectetur adipiscing,NaN,1
			Condimentum aliquet,-13.90,1`;
		const errors = parser.validate(contents);

		expect(errors.length).toBe(6);
	})
	it('should throw an error when content isn`t valid', () => {
		const examplePath = './test.csv';
		const contents = `Product name,Price,Quantit
			Mollis consequat,9.00,2
			Tvoluptatem,10.32,1
			Scelerisque lacinia,18.90,1
			Consectetur adipiscing,28.72,10
			Condimentum aliquet,13.90,1`;
		parser.readFile = jest.fn(path => contents);

		const parseCall = () => parser.parse(examplePath);

		expect(parseCall).toThrow('Validation failed!');
	})
	it('should return an empty array when content is valid', () => {
		const contents = `Product name,Price,Quantity
			Mollis consequat,9.00,2
			Tvoluptatem,10.32,1
			Scelerisque lacinia,18.90,1
			Consectetur adipiscing,28.72,10
			Condimentum aliquet,13.90,1`;
		const errors = parser.validate(contents);

		expect(errors.length).toBe(0);
	})
	it('should return true JSON object when parsing a line of .csv file', () => {
		const csvLine = `Condimentum aliquet,13.90,1`;
		const expectedItem = {
			'name': "Condimentum aliquet",
			'price': 13.9,
			'quantity': 1
		}

		const item = parser.parseLine(csvLine);

		expect(item.id).toBeDefined();
		expect(item).toHaveProperty('name', "Condimentum aliquet");
		expect(item).toHaveProperty('price', 13.9);
		expect(item).toHaveProperty('quantity', 1);
	})
	it('should return true total sum', () => {
		const items = [
			{
				id: "3e6def17-5e87-4f27-b6b8-ae78948523a9",
				name: "Mollis consequat",
				price: 9,
				quantity: 2
			},
			{
				id: "90cd22aa-8bcf-4510-a18d-ec14656d1f6a",
				name: "Tvoluptatem",
				price: 10.32,
				quantity: 1
			},
			{
				id: "33c14844-8cae-4acd-91ed-6209a6c0bc31",
				name: "Scelerisque lacinia",
				price: 18.9,
				quantity: 1
			},
			{
				id: "f089a251-a563-46ef-b27b-5c9f6dd0afd3",
				name: "Consectetur adipiscing",
				price: 28.72,
				quantity: 10
			},
			{
				id: "0d1cbe5e-3de6-4f6a-9c53-bab32c168fbf",
				name: "Condimentum aliquet",
				price: 13.9,
				quantity: 1
			}
		];
		const totalSum = parser.calcTotal(items);

		expect(totalSum).toBeCloseTo(348.32);
	})
});

describe('CartParser - integration test', () => {
	it('should return true JSON object when everything works right', () => {
		const jsonObject = parser.parse('./samples/cart.csv');
		
		expect(jsonObject).toHaveProperty('items');
		expect(jsonObject).toHaveProperty('total');
		expect(jsonObject.items.length).toEqual(5);
		expect(jsonObject.total).toBeCloseTo(348.32);
	}) 
});