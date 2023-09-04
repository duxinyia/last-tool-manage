/**
 * views make
 */
// tableDemo
declare type TableDemoPageType = {
	pageNum: number;
	pageSize: number;
};

declare type TableHeaderType = {
	key: string;
	width: string;
	title: string;
	type: string | number;
	colWidth?: string;
	width?: string | number;
	height?: string | number;
	isCheck: boolean;
	[key: string]: T;
};

declare type TableSearchType = {
	label: string;
	prop: string;
	placeholder?: string;
	required: boolean;
	type: string;
	options?: SelectOptionType[];
	[key: string]: T;
};
declare type TableButtonType = {
	type: string;
	name: string;
	color?: string;
	isSure: boolean;
	[key: string]: T;
};
declare type DialogConfigType = {
	label: string;
	prop: string;
	placeholder: string;
	required: boolean;
	type: string;
	// value:  string;
	options?: SelectOptionType[];
	editDisable?: boolean;
	xs?: number;
	sm?: number;
	md?: number;
	lg?: number;
	xl?: number;
	[key: string]: T;
};
declare type TableDemoState = {
	tableData: {
		data: EmptyObjectType[];
		header: TableHeaderType[];
		config: {
			total: number;
			loading: boolean;
			isBorder: boolean;
			isSelection: boolean;
			isSerialNo: boolean;
			isOperate: boolean;
			isButton: boolean;
			[key: string]: T;
		};
		searchConfig?: {
			isSearchBtn: boolean;
		};
		search: TableSearchType[];
		topBtnConfig?: TableButtonType[];
		btnConfig?: TableButtonType[];
		page: EmptyObjectType;
		printName?: string;
		form: EmptyObjectType;
		dialogConfig?: DialogConfigType[];
		innerDialogConfig?: DialogConfigType[];
		searchConfig?: EmptyObjectType;
	};
};
declare type dialogFormState = {
	formData: EmptyObjectType;
	formInnerData:EmptyObjectType
	vendors: EmptyArrayType;
	dialog: {
		isShowDialog: boolean;
		type: string;
		title?: string;
		submitTxt: string;
		isdisable: boolean;
		num?: number;
	};
	innerdialog: {
		isShowInnerDialog: boolean;
		type: string;
		title?: string;
		submitTxt: string;
		isdisable: boolean;
		num?: number;
	};
};
declare type searchState = {
	form: EmptyObjectType;
	isToggle: boolean;
};

// 維修單收貨彈窗header
declare type deliveryDialogHeader = TableHeaderType[];
// 外链noSearchLink类型
declare type LinkSearchType = {
	label: string;
	prop: string;
	type: string;
	[key: string]: T;
};
declare type LinkState = {
		search: LinkSearchType[];
		searchConfig:boolean;
		form: EmptyObjectType;
};
