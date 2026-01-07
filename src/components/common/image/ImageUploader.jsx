import React, { useState, useRef, useEffect } from 'react';
import { transformToWebp } from '@/utils/transformToWebp';
import DragScroll from '../DragScroll';
import { Skeleton } from '@/components/ui/skeleton';
import {
    PostImagesUpoloader,
    PatchImagesUpoloader,
    GetMeetingNameData,
    getSimpleSettlementData,
} from '@/api/api';
import ToastPopUp from '../../common/ToastPopUp';
import { ImageModal } from '@/components/Modal/ImageModal';

const ImageUploader = ({ meetingId, meetingSimple }) => {
    const [images, setImages] = useState([]);
    const [selectedImageIndex, setSelectedImageIndex] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef(null);
    const [toastPopUp, setToastPopUp] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalImageSrc, setModalImageSrc] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = meetingSimple
                    ? await getSimpleSettlementData(meetingId)
                    : await GetMeetingNameData(meetingId);
                const existingImages = response.data.images;
                setImages(existingImages);
            } catch (error) {
                console.log('Api 데이터 불러오기 실패');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [meetingId, meetingSimple]);

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (selectedImageIndex !== null) {
                const newImages = Array.isArray(images)
                    ? images.map((img, index) =>
                          index === selectedImageIndex ? file : img,
                      )
                    : [];
                setImages(newImages);
                setSelectedImageIndex(null);
            } else {
                setImages(Array.isArray(images) ? [...images, file] : [file]);
            }
            fileInputRef.current.value = '';
        }
    };

    const handleImageDelete = (index) => {
        const newImages = images.filter((_, i) => i !== index);
        setImages(newImages);
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            if (Array.isArray(images) && images.length > 0) {
                const webpImages = await Promise.all(
                    images.map(async (image) => {
                        if (image instanceof File) {
                            return await transformToWebp(image);
                        }
                        return image;
                    }),
                );

                const formData = new FormData();
                const srcArray = images.filter(
                    (image) => typeof image === 'string',
                );

                webpImages.forEach((webpImage) => {
                    if (webpImage instanceof Blob) {
                        formData.append('images', webpImage);
                    }
                });

                let newSrcArray = [];
                if (formData.has('images')) {
                    const response = await PostImagesUpoloader(
                        meetingId,
                        formData,
                    );
                    newSrcArray = response.data;
                }

                const updatedSrcArray = [...srcArray, ...newSrcArray];
                setImages(updatedSrcArray);

                await PatchImagesUpoloader(meetingId, updatedSrcArray);
            } else {
                await PatchImagesUpoloader(meetingId, []);
            }
            setToastPopUp(true);
        } catch (error) {
            console.error('Error uploading image:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageClick = () => {
        setModalImageSrc(images);
        setIsModalOpen(true);
    };

    return (
        <section className="flex flex-col gap-6 items-start bg-white rounded-lg">
            <h3 className="text-lg font-bold">
                모임에서 사용한 영수증을 등록해보세요!
            </h3>
            <DragScroll className="whitespace-nowrap">
                <label
                    htmlFor="file-upload"
                    className="w-24 h-24 flex-shrink-0 flex items-center justify-center border-2 border-dashed border-blue-500 rounded-lg cursor-pointer"
                >
                    <span className="text-2xl text-blue-500">+</span>
                    <input
                        id="file-upload"
                        type="file"
                        onChange={handleImageUpload}
                        className="hidden"
                        ref={fileInputRef}
                    />
                </label>
                {isLoading ? (
                    <Skeleton className="w-24 h-24 bg-gray-100" />
                ) : (
                    images?.map((image, index) => (
                        <div
                            key={index}
                            className="relative border rounded-lg overflow-hidden cursor-pointer flex-shrink-0"
                            onClick={handleImageClick}
                        >
                            <img
                                src={
                                    typeof image === 'string'
                                        ? `${import.meta.env.VITE_S3_BUCKET_URL || 'https://nbbang-receipt-images.s3.ap-northeast-2.amazonaws.com'}/${image}`
                                        : URL.createObjectURL(image)
                                }
                                alt={`uploaded ${index}`}
                                className="w-24 h-24 object-cover"
                            />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleImageDelete(index);
                                }}
                                className="absolute top-2 right-2 bg-red-500 bg-opacity-80 rounded-full px-2 py-1 text-xs text-white"
                            >
                                x
                            </button>
                        </div>
                    ))
                )}
            </DragScroll>
            <button
                className="w-full bg-main-blue text-white text-xs font-bold rounded-lg px-2 py-3 my-2"
                onClick={handleSubmit}
            >
                이미지 등록
            </button>
            {toastPopUp && (
                <ToastPopUp
                    setToastPopUp={setToastPopUp}
                    message={'이미지 등록이 완료 되었습니다.'}
                />
            )}
            {isModalOpen && (
                <ImageModal
                    images={modalImageSrc}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </section>
    );
};

export default ImageUploader;
