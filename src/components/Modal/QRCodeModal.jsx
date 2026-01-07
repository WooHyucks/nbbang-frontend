import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogClose,
} from '@/components/ui/dialog';
import { QRCodeCanvas } from 'qrcode.react';
import { useState } from 'react';

const QRCodeModal = ({
    url,
    imageSrc,
    className,
    title,
    description,
    description2,
    children,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen} modal={false}>
            {isOpen && <div className="fixed inset-0 bg-black/50 z-20"></div>}
            <DialogTrigger asChild>
                {children || (
                    <img
                        src={imageSrc}
                        alt="클릭하여 QR 코드 보기"
                        className={` ${className}`}
                    />
                )}
            </DialogTrigger>
            <DialogContent className="p-6 max-w-md mx-auto text-center bg-white">
                <p className="text-xl font-bold">{title}</p>
                <p className="text-base text-gray-600 mb-4">{description}</p>
                <div className="flex flex-col items-center justify-center">
                    <QRCodeCanvas
                        value={url}
                        size={120}
                        className="border p-3 rounded-md"
                    />
                    <p className="mt-3 text-sm">{description2}</p>
                </div>
                <DialogClose asChild>
                    <button className="text-white font-bold bg-black px-2 py-3 mt-2 rounded-md ">
                        확인
                    </button>
                </DialogClose>
            </DialogContent>
        </Dialog>
    );
};

export default QRCodeModal;
