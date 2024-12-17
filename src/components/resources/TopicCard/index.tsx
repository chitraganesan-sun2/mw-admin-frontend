type Props = {
    index: number;
    item: any;
    onClick: () => void;
};

const gradient =
"linear-gradient(to right, #d5e2f6, #d4e4f6, #d4e6f6, #d4e7f5, #d5e9f5, #d5ebf5, #d5ecf5, #d5eef4, #d4f0f4, #d4f2f3, #d5f3f2, #d6f5f0)";

const gradientReverse =
"linear-gradient(to right, #d6f5f0, #d5f3f2, #d4f2f3, #d4f0f4, #d5eef4, #d5ecf5, #d5ebf5, #d5e9f5, #d4e7f5, #d4e6f6, #d4e4f6, #d5e2f6)";


const TopicCard = ({ index, item, onClick }: Props) => {

    return (
        <>
            <div
                onClick={onClick}
                className='w-[200px] cursor-pointer hover:opacity-80 transition-all duration-300 h-[100px] rounded-xl flex items-center justify-center'
                style={{
                    backgroundImage: index % 2 === 0 ? gradient : gradientReverse,
                }}
            >
                <p className=' font-medium '>{item.title}</p>
            </div>
        </>
    );
};

export default TopicCard;
